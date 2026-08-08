"use client";

import { useState } from "react";
import Link from "next/link";
import type { Review } from "@/lib/types";

/** "여행을 다녀온 분들의 이야기" — 데스크톱 3열 그리드 / 모바일 1개 캐러셀. */

const regionGradient: Record<string, string> = {
  서부지중해: "from-sky-400 to-blue-700",
  동부지중해: "from-sky-400 to-blue-700",
  알래스카: "from-cyan-300 to-sky-600",
  동북아: "from-emerald-300 to-teal-600",
  동남아: "from-rose-300 to-orange-500",
  "동남아/동북아": "from-emerald-300 to-teal-600",
  중동: "from-amber-400 to-orange-700",
};

function ReviewCard({ r }: { r: Review }) {
  return (
    <Link href={`/reviews/${r.id}`} className="group flex cursor-pointer flex-col overflow-hidden rounded-none bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(11,42,74,0.35)]">
      {/* 이미지 */}
      <div className="relative aspect-square w-full overflow-hidden">
        {r.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={r.imageUrl} alt={r.region} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${regionGradient[r.region] ?? "from-sky-400 to-blue-700"}`} />
        )}
      </div>
      {/* 본문 */}
      <div className="flex flex-1 flex-col p-[2.5em]">
        <p className="line-clamp-3 min-h-[4.5rem] text-[min(1.1286vw,21.6691px)] max-[991px]:text-[min(3.5152vw,21.0912px)] max-[501px]:text-[4.269vw] font-semibold leading-relaxed text-black">
          {r.content}
        </p>
        <div className="mt-5 flex items-center justify-between border-t-[0.86px] border-black/20 pt-4 text-[min(0.9405vw,18.0576px)] max-[991px]:text-[min(2.9293vw,17.5758px)] max-[501px]:text-[3.5574vw]">
          <span className="font-semibold text-black">
            {r.author} · {r.region}
          </span>
          <span className="font-light text-black/50">{r.date}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Reviews({ reviews }: { reviews: Review[] }) {
  const [idx, setIdx] = useState(0);
  const move = (d: number) => setIdx((i) => (i + d + reviews.length) % reviews.length);

  return (
    <section className="bg-[#F5F7F9] py-52 max-[991px]:py-16" style={{ fontSize: "calc(var(--font-base) * 0.9)" }}>
      <div className="w-full px-[max(16.534%,calc((100%_-_1920px)/2_+_250px))] max-[991px]:px-[6%] max-[501px]:px-[8%]">
        {/* 헤더 */}
        <div className="mb-20 flex flex-wrap items-center justify-between gap-4 max-[991px]:mb-10 max-[991px]:justify-center">
          <h2 className="text-[min(2.75vw,52.8px)] font-extrabold tracking-tight text-black max-[991px]:text-[min(6.9551vw,41.7306px)] max-[501px]:text-[7.4vw]">
            <span className="text-[#1E4D8B]">여행</span>을 다녀온 분들의{" "}
            <span className="text-[#1E4D8B]">이야기</span>
          </h2>
          <Link
            href="/reviews"
            className="rounded-none bg-[#113667] px-8 py-2 text-[min(0.88vw,16.896px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-semibold text-white transition hover:brightness-125 max-[991px]:hidden"
          >
            전체후기보기
          </Link>
        </div>

        {/* 후기 카드 */}
        {reviews.length === 0 ? (
          <p className="py-16 text-center text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] text-slate-400">
            아직 등록된 후기가 없습니다. 첫 후기를 남겨주세요.
          </p>
        ) : (
          <>
            {/* 데스크톱 3열 그리드 */}
            <div className="grid gap-6 grid-cols-3 max-[991px]:hidden">
              {reviews.map((r) => (
                <ReviewCard key={r.id} r={r} />
              ))}
            </div>

            {/* 모바일 1개 캐러셀 (좌우 화살표) */}
            <div className="relative hidden max-[991px]:block">
              {reviews.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="이전"
                    onClick={() => move(-1)}
                    className="absolute left-0 top-1/2 z-10 -translate-x-full -translate-y-1/2 px-[0.3em] text-[min(2.31vw,44.352px)] max-[991px]:text-[min(7.1949vw,43.1694px)] max-[501px]:text-[8.7378vw] leading-none text-slate-400 transition hover:text-slate-600"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="다음"
                    onClick={() => move(1)}
                    className="absolute right-0 top-1/2 z-10 translate-x-full -translate-y-1/2 px-[0.3em] text-[min(2.31vw,44.352px)] max-[991px]:text-[min(7.1949vw,43.1694px)] max-[501px]:text-[8.7378vw] leading-none text-slate-400 transition hover:text-slate-600"
                  >
                    ›
                  </button>
                </>
              )}
              {/* 전체 카드를 트랙에 깔고 translateX 슬라이드 → 이미지 최초 1회 로드 후 유지 */}
              <div className="overflow-hidden">
                <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
                  {reviews.map((r) => (
                    <div key={r.id} className="w-full shrink-0">
                      <ReviewCard r={r} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 모바일 전체후기보기 (카드 아래 중앙) */}
            <div className="mt-12 hidden justify-center max-[991px]:flex">
              <Link
                href="/reviews"
                className="rounded-none bg-[#113667] px-10 py-3 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] font-semibold text-white transition hover:brightness-125"
              >
                전체후기보기
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
