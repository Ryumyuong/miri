"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { RegionStory } from "@/lib/types";

/**
 * "지역으로 떠나는 크루즈 이야기" — 커버플로우 캐러셀.
 *  중앙 카드(크게/선명) + 좌우 카드(작게/흐리게) + 뒤 영문 워터마크.
 *  ‹ › 화살표로 6개 권역 순환. 카드 사진이 없으면 그라데이션으로 대체.
 */

const regionGradient: Record<string, string> = {
  "미주·알래스카": "from-sky-400 to-cyan-700",
  유럽: "from-sky-500 to-indigo-800",
  중동: "from-amber-500 to-orange-800",
  동남아: "from-emerald-400 to-teal-700",
  동북아: "from-blue-400 to-slate-700",
  "리버 크루즈": "from-teal-500 to-emerald-800",
};

export default function RegionStories({ stories }: { stories: RegionStory[] }) {
  const [active, setActive] = useState(1); // 기본 중앙: 유럽
  const [tick, setTick] = useState(0); // 수동 조작 시 자동 타이머 0초부터 리셋
  const n = stories.length;

  // 모바일(≤990px): 옆 미리보기 숨기고 중앙 1개만
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 990px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const go = (dir: number) => {
    setActive((a) => (a + dir + n) % n);
    setTick((t) => t + 1);
  };

  // 자동 회전 (4초 간격) — 마우스 올리면 일시정지
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (n <= 1 || paused) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 4000);
    return () => clearInterval(t);
  }, [n, paused, tick]);

  // active 기준 부호 있는 위치(-2..3) → 좌:-1 / 중앙:0 / 우:1 만 노출
  const signedOffset = (i: number) => {
    let rel = ((i - active) % n + n) % n;
    if (rel > n / 2) rel -= n;
    return rel;
  };

  // 뷰포트 폭 기준(%) 배치 — 중앙은 가운데, 좌/우 카드는 화면 가장자리로 펼침
  const cardStyle = (rel: number): React.CSSProperties => {
    if (rel === 0)
      return { left: "50%", transform: `translate(-50%, ${isMobile ? "-50%" : "-56%"}) scale(1)`, opacity: 1, zIndex: 30 };
    // 모바일: 중앙 외 카드는 완전히 숨김 (1개만 노출)
    if (isMobile)
      return { left: "50%", transform: "translate(-50%, -50%) scale(0.9)", opacity: 0, zIndex: 10 };
    if (rel === -1)
      return { left: "6%", transform: "translate(-50%, -32%) scale(0.8)", opacity: 0.3, zIndex: 20 };
    if (rel === 1)
      return { left: "94%", transform: "translate(-50%, -32%) scale(0.8)", opacity: 0.3, zIndex: 20 };
    // 그 외: 멀리 밀고 숨김 (들어올 방향으로)
    return {
      left: rel < 0 ? "-25%" : "125%",
      transform: "translate(-50%, -50%) scale(0.7)",
      opacity: 0,
      zIndex: 10,
    };
  };

  const activeStory = stories[active];

  return (
    <section
      className="relative overflow-hidden bg-slate-100 bg-cover bg-center py-48 max-[991px]:pt-16 max-[991px]:pb-32"
      style={{ fontSize: "var(--font-base)", backgroundImage: "url('/region-bg.png')" }}
    >
      {/* 제목 */}
      <div className="relative z-30 mb-28 text-center max-[991px]:mb-16">
        <h2 className="text-[min(2.75vw,52.8px)] font-extrabold tracking-tight max-[991px]:text-[min(6.9551vw,41.7306px)] max-[501px]:text-[7.4vw]">
          <span className="text-navy">지역으로 떠나는</span>{" "}
          <span className="text-[#1E4D8B]">크루즈 이야기</span>
        </h2>
        <p className="text-[min(1.32vw,25.344px)] max-[991px]:text-[min(4.1114vw,24.6684px)] max-[501px]:text-[4.9931vw] font-medium text-[#242424]">
          미리크루즈가 엄선한 6개 권역의 프리미엄 일정
        </p>
      </div>

      {/* 캐러셀 무대 */}
      <div className="relative mx-auto h-[26em] w-full max-[991px]:h-[33em]">
        {/* 배경 워터마크 (active 권역 영문) */}
        <span
          key={activeStory.watermark}
          className="pointer-events-none absolute left-1/2 top-[100%] z-0 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[min(10.01vw,192.192px)] font-black leading-none tracking-tight text-white/50 max-[991px]:translate-y-3 max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw] max-[991px]:font-bold max-[991px]:tracking-[0.3em]"
        >
          {activeStory.watermark}
        </span>

        {/* 카드들 */}
        {stories.map((s, i) => {
          const rel = signedOffset(i);
          const center = rel === 0;
          return (
            <article
              key={s.id}
              onClick={() => {
                if (rel !== 0) {
                  setActive(i);
                  setTick((t) => t + 1);
                }
              }}
              onMouseEnter={center ? () => setPaused(true) : undefined}
              onMouseLeave={center ? () => setPaused(false) : undefined}
              className={`group absolute top-1/2 h-[33em] w-[42em] overflow-hidden rounded-none shadow-2xl transition-all duration-500 ease-out max-[991px]:w-[86vw] ${
                rel !== 0 ? "cursor-pointer" : ""
              }`}
              style={cardStyle(rel)}
            >
              {/* 배경 사진/그라데이션 */}
              {s.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.imageUrl}
                  alt={s.region}
                  className={`absolute inset-0 h-full w-full object-cover ${center ? "transition-transform duration-500 group-hover:scale-110" : ""}`}
                />
              ) : (
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${
                    regionGradient[s.region] ?? "from-sky-500 to-indigo-800"
                  }`}
                />
              )}
              {/* 가독성 오버레이 (#000 20% + #0B2A4A0%→#051628 그라데이션) */}
              <div className="absolute inset-0 bg-black/20" />
              {/* 아래쪽 절반만: 50%부터 #0B2A4A 0%(투명) → 하단 #051628 */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0B2A4A]/0 from-50% to-[#051628]" />

              {/* 우상단 일정 보기 (top/right는 폰트 1.1429em 기준이라 2.975em로 하단 inset 3.4em(=base)과 일치) */}
              <Link
                href={`/cruises?region=${encodeURIComponent(s.region)}`}
                className="absolute right-[2.975em] top-[2.975em] inline-flex items-center gap-[0.4em] border-b border-white/50 pb-[0.6em] text-[min(0.88vw,16.896px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-semibold text-white hover:border-gold hover:text-gold"
              >
                {s.region} 일정 보기 <span className="text-[0.85em]">↗</span>
              </Link>

              {/* 하단 타이틀 + 칩 */}
              <div className="absolute inset-x-[3.4em] bottom-[3.4em] text-white">
                <h3 className="text-[min(1.98vw,38.016px)] max-[991px]:text-[min(6.167vw,37.002px)] max-[501px]:text-[5.8vw] font-extrabold leading-[1.25]">
                  {s.titleLines[0]}
                  <br />
                  {s.titleLines[1]}
                </h3>
                <div className="mt-[0.9em] flex flex-wrap gap-[0.5em]">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-none border-[0.5px] border-white bg-transparent px-[13px] py-[3px] text-[min(0.7337vw,14.087px)] max-[991px]:text-[min(2.2853vw,13.7118px)] max-[501px]:text-[2.7754vw]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          );
        })}

        {/* 화살표 (버튼 이미지) */}
        <button
          aria-label="이전 권역"
          onClick={() => go(-1)}
          className="absolute left-[24%] top-[43%] z-40 -translate-y-1/2 cursor-pointer transition hover:opacity-80 max-[991px]:left-[8%] max-[991px]:top-[calc(100%+3.5em)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/region-prev.png" alt="" className="h-[3.6em] w-[3.6em] object-contain" />
        </button>
        <button
          aria-label="다음 권역"
          onClick={() => go(1)}
          className="absolute right-[24%] top-[43%] z-40 -translate-y-1/2 cursor-pointer transition hover:opacity-80 max-[991px]:right-[8%] max-[991px]:top-[calc(100%+3.5em)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/region-next.png" alt="" className="h-[3.6em] w-[3.6em] -scale-x-100 object-contain" />
        </button>
      </div>
    </section>
  );
}
