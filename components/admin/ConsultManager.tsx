"use client";

import { useState } from "react";
import type { Consult, ConsultStatus } from "@/lib/types";
import { useConsults } from "@/lib/useConsults";
import { addConsult, updateConsult, deleteConsult, seedConsults, type ConsultInput } from "@/lib/consults";
import { buildReplyMessage, sendSms } from "@/lib/sms";
import Pagination from "@/components/admin/Pagination";

const STATUSES: ConsultStatus[] = ["신규", "진행 중", "완료", "보류"];
const statusBadge: Record<string, string> = {
  신규: "bg-blue-100 text-blue-700",
  "진행 중": "bg-amber-100 text-amber-700",
  완료: "bg-emerald-100 text-emerald-700",
  보류: "bg-slate-200 text-slate-500",
};
const empty: ConsultInput = { customerName: "", phone: "", topic: "", status: "신규", createdAt: "" };

export default function ConsultManager() {
  const { consults, loading } = useConsults();
  const [editing, setEditing] = useState<Consult | null | undefined>(undefined);
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const paged = consults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const remove = async (c: Consult) => {
    if (confirm(`${c.customerName}님 상담을 삭제할까요?`)) await deleteConsult(c.id);
  };
  const seed = async () => {
    const n = await seedConsults();
    alert(n > 0 ? `샘플 ${n}건을 불러왔습니다.` : "이미 데이터가 있습니다.");
  };
  const changeStatus = (c: Consult, status: ConsultStatus) => updateConsult(c.id, { status });

  const counts = STATUSES.map((s) => ({ s, n: consults.filter((c) => c.status === s).length }));

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">상담 관리</h1>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">고객 상담 문의를 접수하고 처리합니다</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!loading && consults.length === 0 && (
            <button onClick={seed} className="rounded-lg border border-slate-300 px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">샘플 불러오기</button>
          )}
          <button onClick={() => setEditing(null)} className="rounded-lg bg-navy px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark">+ 상담 등록</button>
        </div>
      </div>

      {!loading && consults.length > 0 && (
        <div className="mb-5 grid grid-cols-4 gap-3">
          {counts.map(({ s, n }) => (
            <div key={s} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{s}</p>
              <p className="mt-1 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.0vw,18px)] max-[501px]:text-[3.7vw] font-bold text-slate-800">{n}건</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : consults.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          상담 내역이 없습니다. <b>샘플 불러오기</b> 또는 <b>상담 등록</b>으로 시작하세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[min(0.9625vw,18.48px)] max-[991px]:whitespace-nowrap max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[1.0714em] text-slate-400">
                  <th className="px-4 py-2.5 text-left font-medium">고객</th>
                  <th className="px-4 py-2.5 text-left font-medium max-[991px]:hidden">연락처</th>
                  <th className="px-4 py-2.5 text-left font-medium">문의 내용</th>
                  <th className="px-4 py-2.5 text-left font-medium">상태</th>
                  <th className="px-4 py-2.5 text-left font-medium max-[991px]:hidden">접수일</th>
                  <th className="px-4 py-2.5 text-right font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{c.customerName}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-[991px]:hidden">{c.phone}</td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <p className="whitespace-pre-line max-[991px]:max-w-[16em] max-[991px]:truncate">{c.topic}</p>
                      {c.reply && (
                        <p className="mt-1 whitespace-pre-line rounded bg-emerald-50 px-2 py-1 text-[1.0714em] text-emerald-700 max-[991px]:max-w-[16em] max-[991px]:truncate">
                          ↳ 답변: {c.reply}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={c.status}
                        onChange={(e) => changeStatus(c, e.target.value as ConsultStatus)}
                        className={`rounded-md px-2 py-0.5 text-[1.0714em] font-semibold outline-none ${statusBadge[c.status] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 max-[991px]:hidden">{c.createdAt}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => setEditing(c)} className="mr-2 text-[1.0714em] font-semibold text-brand hover:underline">{c.reply ? "답변수정" : "답변/수정"}</button>
                      <button onClick={() => remove(c)} className="text-[1.0714em] font-semibold text-red-500 hover:underline">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination total={consults.length} pageSize={PAGE_SIZE} page={page} onPage={setPage} />

      {editing !== undefined && <ConsultForm initial={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function ConsultForm({ initial, onClose }: { initial?: Consult; onClose: () => void }) {
  const [f, setF] = useState<ConsultInput>(
    initial
      ? { customerName: initial.customerName, phone: initial.phone, topic: initial.topic, status: initial.status, createdAt: initial.createdAt, reply: initial.reply ?? "" }
      : empty,
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof ConsultInput, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ConsultInput = { ...f };
      const replyChanged = !!f.reply?.trim() && f.reply.trim() !== (initial?.reply ?? "").trim();
      if (f.reply && f.reply.trim()) payload.repliedAt = new Date().toISOString().slice(0, 10);
      if (initial) await updateConsult(initial.id, payload);
      else await addConsult(payload);
      // 답변이 새로 등록/변경되면 고객에게 문자 알림 발송
      if (replyChanged && f.phone && confirm(`${f.customerName}님(${f.phone})에게 답변을 문자로 발송하시겠습니까?`)) {
        await sendSms(f.phone, buildReplyMessage(f.customerName, f.reply!.trim()));
      }
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
          <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">{initial ? "상담 수정" : "상담 등록"}</h2>
          <button type="button" onClick={onClose} className="shrink-0 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 transition hover:text-slate-600" aria-label="닫기">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="고객명"><input className={inp} value={f.customerName} onChange={(e) => set("customerName", e.target.value)} required /></Field>
          <Field label="연락처"><input className={inp} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="010-0000-0000" /></Field>
          <Field label="접수일"><input type="date" className={inp} value={f.createdAt} onChange={(e) => set("createdAt", e.target.value)} /></Field>
          <Field label="상태">
            <select className={inp} value={f.status} onChange={(e) => set("status", e.target.value as ConsultStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="문의 내용" full><textarea className={inp} rows={3} value={f.topic} onChange={(e) => set("topic", e.target.value)} required /></Field>
          <Field label="답변 (고객 문의에 대한 답변)" full>
            <textarea className={inp} rows={4} value={f.reply ?? ""} onChange={(e) => set("reply", e.target.value)} placeholder="고객에게 전달할 답변을 입력하세요." />
          </Field>
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
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
