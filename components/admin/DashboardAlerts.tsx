"use client";

import Link from "next/link";
import { useAlerts } from "@/lib/useAlerts";
import { useReservations } from "@/lib/useReservations";
import { computePassportAlerts } from "@/lib/reservations";

const alertStyles: Record<string, string> = {
  danger: "border-red-200 bg-red-50 text-red-600",
  warning: "border-amber-200 bg-amber-50 text-amber-600",
  info: "border-sky-200 bg-sky-50 text-sky-600",
};

export default function DashboardAlerts({ limit }: { limit?: number }) {
  const { alerts, loading } = useAlerts();
  const { reservations } = useReservations();

  // 여권 상태 알림(자동 계산)을 수동 알림보다 먼저 표시
  const all = [...computePassportAlerts(reservations), ...alerts];
  const shown = limit ? all.slice(0, limit) : all;

  return (
    <>
      {loading ? (
        <p className="py-6 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">불러오는 중…</p>
      ) : all.length === 0 ? (
        <p className="py-6 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">알림이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {shown.map((a) => (
            <li key={a.id} className={`rounded-lg border px-3 py-2.5 ${alertStyles[a.level]}`}>
              <span className="inline-block rounded bg-white/70 px-1.5 py-0.5 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-bold">
                {a.tag}
              </span>
              <p className="mt-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-600">{a.message}</p>
            </li>
          ))}
        </ul>
      )}
      <Link href="/admin/alerts" className="mt-3 block text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-brand">
        {limit && all.length > limit ? `모든 알림 보기 (+${all.length - limit})` : "모든 알림 보기"}
      </Link>
    </>
  );
}
