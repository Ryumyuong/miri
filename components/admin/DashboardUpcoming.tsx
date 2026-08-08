"use client";

import { useVoyages } from "@/lib/useVoyages";
import { useReservations } from "@/lib/useReservations";
import { aggregateForVoyage } from "@/lib/reservations";

const statusBadge: Record<string, string> = {
  "출발 확정": "bg-emerald-100 text-emerald-700",
  "예약 중": "bg-sky-100 text-sky-700",
  "예약 가능": "bg-slate-100 text-slate-600",
  마감: "bg-slate-200 text-slate-500",
};

export default function DashboardUpcoming() {
  const { voyages, loading } = useVoyages();
  const { reservations } = useReservations();
  const upcoming = voyages.filter((v) => v.status !== "마감").slice(0, 3);

  if (loading) {
    return <p className="py-6 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">불러오는 중…</p>;
  }
  if (upcoming.length === 0) {
    return <p className="py-6 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">등록된 일정이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {upcoming.map((v) => (
        <li
          key={v.id}
          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/admin/ship.png" alt="" className="h-5 w-5 object-contain" />
            </span>
            <div>
              <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-800">{v.region}</p>
              <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{v.shipName}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                {/* eslint-disable @next/next/no-img-element */}
                <img src="/icons/admin/clock.png" alt="" className="h-3.5 w-3.5 object-contain" />
                {v.departDate}
                <span className="mx-0.5">·</span>
                <img src="/icons/admin/user.png" alt="" className="h-3.5 w-3.5 object-contain" />
                {aggregateForVoyage(reservations, v.id).reservedCount}명 예약
                {/* eslint-enable @next/next/no-img-element */}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-medium ${
              statusBadge[v.status] ?? "bg-slate-100 text-slate-600"
            }`}
          >
            {v.status}
          </span>
        </li>
      ))}
    </ul>
  );
}
