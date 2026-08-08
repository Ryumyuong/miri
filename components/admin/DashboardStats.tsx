"use client";

import { useReservations } from "@/lib/useReservations";
import { useVoyages } from "@/lib/useVoyages";
import { usePayments } from "@/lib/usePayments";
import { useConsults } from "@/lib/useConsults";

function thisMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}
function prevMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

/** 전월 대비 증감률 문자열 (전월 0이면 표시 안 함) */
function pctDelta(cur: number, prev: number): string | undefined {
  if (prev === 0) return undefined;
  const p = Math.round(((cur - prev) / prev) * 100);
  return `${p >= 0 ? "+" : ""}${p}%`;
}

function wonShort(n: number): string {
  if (n >= 1_000_000) return `₩${Math.round(n / 1_000_000)}M`;
  return `₩${n.toLocaleString("ko-KR")}`;
}

export default function DashboardStats() {
  const { reservations } = useReservations();
  const { voyages } = useVoyages();
  const { payments } = usePayments();
  const { consults } = useConsults();

  const cur = thisMonth();
  const prev = prevMonth();

  // 이번 달 예약 (신청 생성일 기준) — 건수 + 인원수
  const bookingsCur = reservations.filter((r) => r.createdAt.slice(0, 7) === cur).length;
  const bookingsPrev = reservations.filter((r) => r.createdAt.slice(0, 7) === prev).length;
  const peopleCur = reservations
    .filter((r) => r.createdAt.slice(0, 7) === cur)
    .reduce((s, r) => s + (r.headcount ?? r.passengers?.length ?? 1), 0);

  // 확정 출발 (상태 = 출발 확정)
  const confirmed = voyages.filter((v) => v.status === "출발 확정").length;

  // 진행 중 상담
  const ongoing = consults.filter((c) => c.status === "진행 중").length;

  // 이번 달 매출 (납입액 합)
  const revenueCur = payments
    .filter((p) => p.date.slice(0, 7) === cur)
    .reduce((sum, p) => sum + p.paid, 0);
  const revenuePrev = payments
    .filter((p) => p.date.slice(0, 7) === prev)
    .reduce((sum, p) => sum + p.paid, 0);

  const stats: { label: string; value: string; delta?: string; sub?: string }[] = [
    { label: "이번 달 예약", value: `${bookingsCur}건`, sub: `총 ${peopleCur}명`, delta: pctDelta(bookingsCur, bookingsPrev) },
    { label: "확정 출발", value: String(confirmed) },
    { label: "진행 중 상담", value: String(ongoing) },
    { label: "이번 달 매출", value: wonShort(revenueCur), delta: pctDelta(revenueCur, revenuePrev) },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 max-[991px]:grid-cols-2">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{s.label}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">{s.value}</span>
            {s.delta && (
              <span
                className={`text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold ${
                  s.delta.startsWith("-") ? "text-red-500" : "text-emerald-500"
                }`}
              >
                {s.delta}
              </span>
            )}
          </div>
          {s.sub && <p className="mt-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-[#1E4D8B]">{s.sub}</p>}
        </div>
      ))}
    </div>
  );
}
