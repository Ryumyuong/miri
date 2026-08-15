"use client";

import { useState } from "react";
import type { AlertItem, AlertLevel } from "@/lib/types";
import { useAlerts } from "@/lib/useAlerts";
import Link from "next/link";
import { useReservations } from "@/lib/useReservations";
import { useConsults } from "@/lib/useConsults";
import { computePassportAlerts } from "@/lib/reservations";
import { computeConsultAlerts } from "@/lib/consults";
import { addAlert, updateAlert, deleteAlert, seedAlerts, type AlertInput } from "@/lib/alerts";
import Pagination from "@/components/admin/Pagination";

const LEVELS: { value: AlertLevel; label: string }[] = [
  { value: "danger", label: "긴급(빨강)" },
  { value: "warning", label: "주의(주황)" },
  { value: "info", label: "정보(파랑)" },
];
const levelStyle: Record<string, string> = {
  danger: "border-red-200 bg-red-50",
  warning: "border-amber-200 bg-amber-50",
  info: "border-sky-200 bg-sky-50",
};
const empty: AlertInput = { level: "warning", tag: "", message: "" };

export default function AlertManager() {
  const { alerts, loading } = useAlerts();
  const { reservations } = useReservations();
  const passportAlerts = computePassportAlerts(reservations);
  const { consults } = useConsults();
  const consultAlerts = computeConsultAlerts(consults);
  const [editing, setEditing] = useState<AlertItem | null | undefined>(undefined);
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const paged = alerts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const remove = async (a: AlertItem) => {
    if (confirm(`"${a.tag}" 알림을 삭제할까요?`)) await deleteAlert(a.id);
  };
  const seed = async () => {
    const n = await seedAlerts();
    alert(n > 0 ? `샘플 ${n}건을 불러왔습니다.` : "이미 데이터가 있습니다.");
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 max-[501px]:flex-col max-[501px]:gap-3">
        <div>
          <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">알림 현황</h1>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">여권·잔금·출발 관련 운영 알림을 관리합니다</p>
        </div>
        <div className="flex shrink-0 gap-2 max-[501px]:self-end">
          {!loading && alerts.length === 0 && (
            <button onClick={seed} className="rounded-lg border border-slate-300 px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">샘플 불러오기</button>
          )}
          <button onClick={() => setEditing(null)} className="rounded-lg bg-navy px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark">+ 알림 추가</button>
        </div>
      </div>

      {/* 새 상담문의 자동 알림 (상담 접수 즉시 표시, 답변 처리하면 사라짐) */}
      <div className="mb-6">
        <p className="mb-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-slate-600">
          새 상담문의 <span className="text-[1.0714em] font-medium text-slate-400">자동 · {consultAlerts.length}건</span>
        </p>
        {consultAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
            답변 대기 중인 상담문의가 없습니다. (홈페이지 상담 신청이 접수되면 자동 표시)
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {consultAlerts.map((a) => (
              <Link
                key={a.id}
                href={a.href ?? "/admin/consults"}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition hover:brightness-95 ${levelStyle[a.level]}`}
              >
                <div>
                  <span className="inline-block rounded bg-white/70 px-1.5 py-0.5 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-bold text-slate-700">{a.tag}</span>
                  <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.1vw] text-slate-600">{a.message}</p>
                </div>
                <span className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-semibold text-slate-400">답변하기 →</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 여권 상태 자동 알림 (신청 데이터 기반, 읽기 전용) */}
      <div className="mb-6">
        <p className="mb-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-slate-600">
          여권 상태 <span className="text-[1.0714em] font-medium text-slate-400">자동 · {passportAlerts.length}건</span>
        </p>
        {passportAlerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
            여권 관련 자동 알림이 없습니다. (가예약 신청 데이터에서 실시간 계산)
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {passportAlerts.map((a) => (
              <div key={a.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${levelStyle[a.level]}`}>
                <div>
                  <span className="inline-block rounded bg-white/70 px-1.5 py-0.5 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-bold text-slate-700">{a.tag}</span>
                  <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.1vw] text-slate-600">{a.message}</p>
                </div>
                <span className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-semibold text-slate-400">자동</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mb-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-slate-600">수동 알림</p>
      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          등록된 알림이 없습니다. <b>샘플 불러오기</b> 또는 <b>알림 추가</b>로 시작하세요.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {paged.map((a) => (
            <div key={a.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${levelStyle[a.level]}`}>
              <div>
                <span className="inline-block rounded bg-white/70 px-1.5 py-0.5 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-bold text-slate-700">{a.tag}</span>
                <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.1vw] text-slate-600">{a.message}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setEditing(a)} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 max-[501px]:px-2 max-[501px]:py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[2.7vw] font-semibold text-slate-600 hover:bg-slate-50">수정</button>
                <button onClick={() => remove(a)} className="rounded-md border border-red-200 bg-white px-3 py-1.5 max-[501px]:px-2 max-[501px]:py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[2.7vw] font-semibold text-red-500 hover:bg-red-50">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination total={alerts.length} pageSize={PAGE_SIZE} page={page} onPage={setPage} />

      {editing !== undefined && <AlertForm initial={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function AlertForm({ initial, onClose }: { initial?: AlertItem; onClose: () => void }) {
  const [f, setF] = useState<AlertInput>(
    initial ? { level: initial.level, tag: initial.tag, message: initial.message } : empty,
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof AlertInput, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) await updateAlert(initial.id, f);
      else await addAlert(f);
      onClose();
    } catch (err) {
      alert("저장 실패: " + (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={save} className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white px-6 pt-6 pb-0 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">{initial ? "알림 수정" : "알림 추가"}</h2>
          <button type="button" onClick={onClose} className="shrink-0 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 transition hover:text-slate-600" aria-label="닫기">✕</button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="태그"><input className={inp} value={f.tag} onChange={(e) => set("tag", e.target.value)} placeholder="D-150 / 여권 만료 …" required /></Field>
            <Field label="레벨">
              <select className={inp} value={f.level} onChange={(e) => set("level", e.target.value as AlertLevel)}>
                {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="메시지"><textarea className={inp} rows={2} value={f.message} onChange={(e) => set("message", e.target.value)} required /></Field>
        </div>
        <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">취소</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-navy px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark disabled:opacity-50">{saving ? "저장 중…" : "저장"}</button>
        </div>
      </form>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-[1.25em] outline-none focus:border-brand";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
