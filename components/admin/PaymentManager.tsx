"use client";

import { useState } from "react";
import type { Payment, PaymentStatus } from "@/lib/types";
import { usePayments } from "@/lib/usePayments";
import { addPayment, updatePayment, deletePayment, seedPayments, type PaymentInput } from "@/lib/payments";
import Pagination from "@/components/admin/Pagination";

const STATUSES: PaymentStatus[] = ["결제완료", "부분결제", "미결제", "환불"];
const statusBadge: Record<string, string> = {
  결제완료: "bg-emerald-100 text-emerald-700",
  부분결제: "bg-sky-100 text-sky-700",
  미결제: "bg-orange-100 text-orange-600",
  환불: "bg-slate-200 text-slate-500",
};

const won = (n: number) => "₩" + n.toLocaleString("ko-KR");
const empty: PaymentInput = { customerName: "", voyageTitle: "", amount: 0, paid: 0, status: "미결제", date: "" };

export default function PaymentManager() {
  const { payments, loading } = usePayments();
  const [editing, setEditing] = useState<Payment | null | undefined>(undefined);
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const paged = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const remove = async (p: Payment) => {
    if (confirm(`${p.customerName}님 결제 내역을 삭제할까요?`)) await deletePayment(p.id);
  };
  const seed = async () => {
    const n = await seedPayments();
    alert(n > 0 ? `샘플 ${n}건을 불러왔습니다.` : "이미 데이터가 있습니다.");
  };

  const totalPaid = payments.reduce((s, p) => s + p.paid, 0);
  const totalAmount = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">결제 관리</h1>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">예약별 결제 및 잔금 현황을 관리합니다</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!loading && payments.length === 0 && (
            <button onClick={seed} className="rounded-lg border border-slate-300 px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">샘플 불러오기</button>
          )}
          <button onClick={() => setEditing(null)} className="rounded-lg bg-navy px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark">+ 결제 등록</button>
        </div>
      </div>

      {!loading && payments.length > 0 && (
        <div className="mb-5 grid grid-cols-[0.75fr_1fr_1fr] gap-3">
          <Summary label="결제 건수" value={`${payments.length}건`} />
          <Summary label="수금액" value={won(totalPaid)} color="text-emerald-600" />
          <Summary label="총 계약액" value={won(totalAmount)} color="text-navy" />
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          결제 내역이 없습니다. <b>샘플 불러오기</b> 또는 <b>결제 등록</b>으로 시작하세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[1em] text-slate-400">
                  <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">고객</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">일정</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">계약금액</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">결제액</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">상태</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">날짜</th>
                  <th className="whitespace-nowrap px-4 py-2.5 text-left font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 text-[1em] font-medium text-slate-700">{p.customerName}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{p.voyageTitle}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{won(p.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">{won(p.paid)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className={`rounded-md px-2 py-0.5 text-[1em] font-semibold ${statusBadge[p.status] ?? "bg-slate-100 text-slate-600"}`}>{p.status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-400">{p.date}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <button onClick={() => setEditing(p)} className="mr-2 text-[1em] font-semibold text-brand hover:underline">수정</button>
                      <button onClick={() => remove(p)} className="text-[1em] font-semibold text-red-500 hover:underline">삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination total={payments.length} pageSize={PAGE_SIZE} page={page} onPage={setPage} />

      {editing !== undefined && <PaymentForm initial={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function PaymentForm({ initial, onClose }: { initial?: Payment; onClose: () => void }) {
  const [f, setF] = useState<PaymentInput>(
    initial
      ? { customerName: initial.customerName, voyageTitle: initial.voyageTitle, amount: initial.amount, paid: initial.paid, status: initial.status, date: initial.date }
      : empty,
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof PaymentInput, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) await updatePayment(initial.id, f);
      else await addPayment(f);
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
          <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">{initial ? "결제 수정" : "결제 등록"}</h2>
          <button type="button" onClick={onClose} className="shrink-0 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 transition hover:text-slate-600" aria-label="닫기">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="고객명"><input className={inp} value={f.customerName} onChange={(e) => set("customerName", e.target.value)} required /></Field>
          <Field label="날짜"><input type="date" className={inp} value={f.date} onChange={(e) => set("date", e.target.value)} /></Field>
          <Field label="일정" full><input className={inp} value={f.voyageTitle} onChange={(e) => set("voyageTitle", e.target.value)} /></Field>
          <Field label="계약금액"><input type="number" className={inp} value={f.amount} onChange={(e) => set("amount", +e.target.value)} /></Field>
          <Field label="결제액"><input type="number" className={inp} value={f.paid} onChange={(e) => set("paid", +e.target.value)} /></Field>
          <Field label="상태" full>
            <select className={inp} value={f.status} onChange={(e) => set("status", e.target.value as PaymentStatus)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
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
function Summary({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="whitespace-nowrap text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[2.5vw] text-slate-400">{label}</p>
      <p className={`mt-1 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.0vw,18px)] max-[501px]:text-[3.7vw] font-bold ${color ?? "text-slate-800"}`}>{value}</p>
    </div>
  );
}
