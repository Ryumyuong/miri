"use client";

import { useState } from "react";
import { useSettings } from "@/lib/settings";

/** 전화상담 버튼 → 근무시간 안내 모달 → 전화 연결하기 */
export default function PhoneConsult({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();
  const telHref = `tel:${settings.phone.replace(/[^0-9+]/g, "")}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        전화상담
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          style={{ fontSize: "var(--font-base)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="relative px-7 pt-7 pb-5 text-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                className="absolute right-4 top-4 text-slate-300 transition hover:text-slate-500"
              >
                ✕
              </button>
              <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold tracking-[0.3em] text-gold">PHONE CONSULT</p>
              <h2 className="mt-2 text-[min(1.375vw,26.4px)] max-[991px]:text-[min(4.2826vw,25.6956px)] max-[501px]:text-[5.201vw] font-black text-navy">전화상담</h2>
              <p className="mt-3 text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw] font-black tracking-tight text-navy">{settings.phone}</p>
            </div>

            {/* 안내 */}
            <div className="px-7 pb-7">
              <dl className="rounded-xl bg-slate-50 px-5 py-4 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-400">상담 시간</dt>
                  <dd className="font-semibold text-slate-700">{settings.businessHours}</dd>
                </div>
                <p className="mt-2 border-t border-slate-200 pt-2 text-[1.0714em] text-slate-400">
                  주말·공휴일은 상담이 제한될 수 있습니다.
                </p>
              </dl>

              <a
                href={telHref}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark"
              >
                📞 전화 연결하기
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 w-full rounded-lg py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-400 transition hover:text-slate-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
