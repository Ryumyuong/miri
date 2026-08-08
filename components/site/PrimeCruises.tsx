"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Voyage } from "@/lib/types";
import ConsultButton from "./ConsultButton";

const PER_PAGE = 3;

function won(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

const regionGradient: Record<string, string> = {
  "미주·알래스카": "from-cyan-200 to-sky-500",
  유럽: "from-orange-200 to-amber-500",
  동남아: "from-rose-300 to-orange-400",
  중동: "from-amber-300 to-orange-600",
  동북아: "from-sky-200 to-blue-500",
  "리버 크루즈": "from-teal-300 to-emerald-600",
};

export default function PrimeCruises({ voyages }: { voyages: Voyage[] }) {
  const [page, setPage] = useState(0);
  const [tick, setTick] = useState(0); // 수동 조작 시 자동 타이머 0초부터 리셋
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 990px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const perPage = isMobile ? 1 : PER_PAGE; // 모바일은 1개씩
  const pages = Math.max(1, Math.ceil(voyages.length / perPage));
  const cur = Math.min(page, pages - 1);
  const shown = voyages.slice(cur * perPage, cur * perPage + perPage);
  const move = (d: number) => {
    setPage((p) => (p + d + pages) % pages);
    setTick((t) => t + 1);
  };

  // 여러 페이지면 4초마다 자동 순환 (수동 조작 시 타이머 리셋)
  useEffect(() => {
    if (pages <= 1) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages), 4000);
    return () => clearInterval(id);
  }, [pages, tick]);

  return (
    <section className="bg-white pb-40 pt-20 max-[991px]:pb-16" style={{ fontSize: "var(--font-base)" }}>
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold tracking-[0.35em] text-gold">
          PRIME BENEFITS
        </p>
        <h2 className="mt-3 text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw] font-black text-black">엄선된 프라임 일정</h2>
      </div>

      <div className="relative w-full px-[max(10.78%,calc((100%_-_1920px)/2_+_163px))] max-[991px]:px-[13%]">
        {/* 모바일 좌우 화살표 */}
        {pages > 1 && (
          <>
            <button
              type="button"
              aria-label="이전"
              onClick={() => move(-1)}
              className="absolute left-[2%] top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[min(1.232vw,23.6544px)] max-[991px]:text-[min(3.8373vw,23.0238px)] max-[501px]:text-[4.6602vw] leading-none text-slate-600 shadow-md transition hover:bg-white max-[991px]:grid"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="다음"
              onClick={() => move(1)}
              className="absolute right-[2%] top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[min(1.232vw,23.6544px)] max-[991px]:text-[min(3.8373vw,23.0238px)] max-[501px]:text-[4.6602vw] leading-none text-slate-600 shadow-md transition hover:bg-white max-[991px]:grid"
            >
              ›
            </button>
          </>
        )}
        <div className="grid gap-6 grid-cols-3 max-[991px]:!grid-cols-1">
        {shown.map((v) => (
          <article
            key={v.id}
            className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(11,42,74,0.35)]"
          >
            {/* 썸네일 + 뱃지 */}
            <div className="relative aspect-[380.58/235.6] w-full overflow-hidden">
              {v.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br ${
                    regionGradient[v.region] ?? "from-sky-200 to-blue-400"
                  }`}
                />
              )}
              <div className="absolute left-3 top-3 flex items-center gap-1.5">
                <span className="rounded-full bg-[#C9A961] px-2.5 py-1 text-[min(0.7155vw,13.7376px)] max-[991px]:text-[min(2.2285vw,13.371px)] max-[501px]:text-[2.7064vw] font-bold text-white">
                  Prime
                </span>
                <span className="rounded-full bg-black/55 px-2.5 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-medium text-white backdrop-blur">
                  {v.region}
                </span>
              </div>
            </div>

            {/* 본문 */}
            <div className="p-4">
              <h3 className="line-clamp-2 min-h-[2.6rem] text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold leading-snug text-navy">
                {v.title}
              </h3>
              {v.priceFrom > 0 ? (
                <>
                  <p className="mt-4 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] text-slate-400">상품가 (성인 1인 기준)</p>
                  <p className="text-[min(1.375vw,26.4px)] max-[991px]:text-[min(4.2826vw,25.6956px)] max-[501px]:text-[5.201vw] font-semibold text-[#0B2A4A]">{won(v.priceFrom)}~</p>
                </>
              ) : (
                <p className="mt-4 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-semibold text-[#0B2A4A]">요금문의</p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/cruises/${v.id}`}
                  className="rounded-none bg-navy py-2.5 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-white transition hover:bg-navy-dark"
                >
                  상세보기
                </Link>
                <ConsultButton
                  voyageTitle={v.title}
                  className="rounded-none border border-slate-300 py-2.5 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
                >
                  예약문의
                </ConsultButton>
              </div>
            </div>
          </article>
        ))}
        </div>
      </div>

      {/* 페이지 인디케이터 */}
      {pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                setPage(i);
                setTick((t) => t + 1);
              }}
              aria-label={`${i + 1}페이지`}
              className={`h-2.5 rounded-full transition-all ${
                i === cur ? "w-6 bg-[#C9A961]" : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
