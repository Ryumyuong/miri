"use client";

import { useEffect, useState } from "react";

/** "프라임만의 특별함" — 큰 활성 이미지 + 우측 미리보기 카드 커버플로우. */

type Benefit = { title: string; subtitle: string; image: string };

const BENEFITS: Benefit[] = [
  { title: "특급 선박", subtitle: "세계 최고급 크루즈 라인 엄선", image: "/prime-1.png" },
  { title: "미식 다이닝", subtitle: "미슐랭급 셰프의 코스 요리", image: "/prime-2.png" },
  { title: "스위트 객실", subtitle: "프라이빗한 최상급 객실", image: "/prime-3.png" },
];

export default function PrimeBenefits() {
  const [active, setActive] = useState(0);
  const [tick, setTick] = useState(0); // 수동 조작 시 자동 타이머 0초부터 리셋
  const n = BENEFITS.length;
  const go = (d: number) => {
    setActive((a) => (a + d + n) % n);
    setTick((t) => t + 1);
  };

  // 4초마다 자동 순환 (수동 조작 시 타이머 리셋)
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % n), 4000);
    return () => clearInterval(id);
  }, [n, tick]);

  // active 부터 순서대로 4개 (앞 1개 크게, 나머지 미리보기)
  const ordered = Array.from({ length: n }, (_, i) => BENEFITS[(active + i) % n]);
  const cur = BENEFITS[active];

  return (
    <section className="bg-white pb-32 pt-48 max-[991px]:pb-16 max-[991px]:pt-16" style={{ fontSize: "var(--font-base)" }}>
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold tracking-[0.43em] text-[#DBBA5D]">
          PRIME BENEFITS
        </p>
        <h2 className="mt-3 text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw] font-black text-black">프라임만의 특별함</h2>
        <p className="mt-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-medium text-[#242424]">
          엄선된 프리미엄 크루즈 라인과 최상급 서비스
        </p>
      </div>

      {/* 커버플로우 */}
      <div className="relative w-full pl-[10.78%] pr-[3%] max-[991px]:px-[6%]">
        {/* 맨 왼쪽(큰 이미지 왼편) 이전 화살표 — 데스크톱 전용 */}
        <button
          aria-label="이전"
          onClick={() => go(-1)}
          className="absolute bottom-[1.75rem] left-[calc(10.78%-3.25rem)] z-10 grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand hover:text-brand max-[991px]:hidden"
        >
          ‹
        </button>
        <div className="flex items-stretch gap-5 overflow-hidden max-[991px]:flex-col max-[991px]:gap-4">
          {/* 첫 이미지 — 오른쪽 컬럼(미리보기 + 라벨) 높이에 맞춰 늘어남 (모바일은 단독 전체폭) */}
          <div className="relative w-[52%] shrink-0 overflow-hidden rounded-none shadow-lg max-[991px]:aspect-[4/3] max-[991px]:w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ordered[0].image}
              alt={ordered[0].title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          {/* 오른쪽: 미리보기 이미지 + 라벨/화살표 (첫 이미지 오른쪽에 붙음) */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex gap-5 max-[991px]:hidden">
              {ordered.slice(1).map((b) => (
                <div
                  key={b.title}
                  className="relative h-64 w-[65%] shrink-0 overflow-hidden rounded-none opacity-20 shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.image} alt={b.title} className="absolute inset-0 h-full w-full object-cover" />
                </div>
              ))}
            </div>

            {/* 라벨 + 화살표 */}
            <div className="mt-auto flex w-[65%] items-center justify-between gap-6 pt-28 max-[991px]:mt-4 max-[991px]:w-full max-[991px]:pt-4">
              {/* 왼쪽 슬롯 — 데스크톱: 다음(›) / 모바일: 이전(‹) */}
              <button
                aria-label="다음"
                onClick={() => go(1)}
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand hover:text-brand max-[991px]:hidden"
              >
                ›
              </button>
              <button
                aria-label="이전"
                onClick={() => go(-1)}
                className="hidden h-10 w-10 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand hover:text-brand max-[991px]:grid"
              >
                ‹
              </button>
              <div className="text-center">
                <p className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">{cur.title}</p>
                <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">{cur.subtitle}</p>
              </div>
              {/* 오른쪽 슬롯 — 데스크톱: 빈 자리(텍스트 중앙 유지) / 모바일: 다음(›) */}
              <span aria-hidden className="h-10 w-10 max-[991px]:hidden" />
              <button
                aria-label="다음"
                onClick={() => go(1)}
                className="hidden h-10 w-10 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand hover:text-brand max-[991px]:grid"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
