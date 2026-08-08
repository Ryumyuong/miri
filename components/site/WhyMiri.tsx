"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * "미리크루즈가 특별한 이유" — 좌측 01~04 번호 탭을 누르면
 *  우측 이미지 + 타이틀 + 설명이 전환됩니다. (01만 캡쳐 제공, 나머지는 임시 문구)
 */

type Feature = {
  titleLines: [string, string];
  descLines: [string, string];
  imageUrl?: string;
  gradient: string;
};

const FEATURES: Feature[] = [
  {
    titleLines: ["전문 상담원이", "함께하는 크루즈"],
    descLines: [
      "처음 떠나는 크루즈도 어렵지 않도록",
      "지역, 일정, 객실, 준비사항을 쉽게 안내합니다.",
    ],
    imageUrl: "/why-1.png",
    gradient: "from-sky-300 to-blue-600",
  },
  {
    titleLines: ["출항 회차 중심의", "체계적인 관리"],
    descLines: [
      "예약 인원, 여권 정보, 계약금 안내, 출발 확정 여부를 회차별로 정리해 안정적으로 운영합니다.",
      "",
    ],
    imageUrl: "/why-2.png",
    gradient: "from-indigo-300 to-indigo-700",
  },
  {
    titleLines: ["일정표와 기항지", "정보의 표준화"],
    descLines: [
      "기항지 카드와 선박 카드 시스템으로 누가 만들어도 일관된 고급 일정표를 제공합니다.",
      "",
    ],
    imageUrl: "/why-3.png",
    gradient: "from-teal-300 to-emerald-700",
  },
  {
    titleLines: ["시니어 고객을 위한", "편안한 UX"],
    descLines: [
      "큰 글씨, 쉬운 버튼, 전화 상담 중심으로 누구나 편하게 확인하고 문의할 수 있습니다.",
      "",
    ],
    imageUrl: "/why-4.png",
    gradient: "from-amber-300 to-orange-600",
  },
];

export default function WhyMiri() {
  const n = FEATURES.length;
  // 무한순환: 배열을 3배로 두고 '중앙 복사본' 인덱스(pos)를 이동. 끝에 닿으면 애니메이션 없이 리셋.
  const [pos, setPos] = useState(n); // 시작 = 중앙 복사본의 0번
  const [anim, setAnim] = useState(true);
  const [tick, setTick] = useState(0); // 수동 조작 시 자동 타이머 0초부터 리셋
  const active = ((pos % n) + n) % n;
  const f = FEATURES[active];
  const tripled = [...FEATURES, ...FEATURES, ...FEATURES];

  // 5초마다 자동 전환 (수동 조작 시 tick 변경 → 타이머 0초부터 리셋)
  useEffect(() => {
    const id = setInterval(() => setPos((p) => p + 1), 5000);
    return () => clearInterval(id);
  }, [tick]);

  // 슬라이드가 중앙 복사본 밖으로 나가면 애니메이션 끄고 동일 위치로 리셋 → 무한 루프
  const onSlideEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== "transform") return;
    if (pos < n || pos >= 2 * n) {
      setAnim(false);
      setPos(n + active);
    }
  };
  useEffect(() => {
    if (!anim) {
      const id = requestAnimationFrame(() => setAnim(true));
      return () => cancelAnimationFrame(id);
    }
  }, [anim]);

  return (
    <section
      className="bg-white py-64 max-[991px]:py-16"
      style={{ fontSize: "calc(var(--font-base) * 0.9)" }}
    >
      {/* 헤더 (중앙) */}
      <div className="mb-[6em] text-center max-[991px]:mb-8">
        <p className="text-[min(0.99vw,19.008px)] max-[991px]:text-[min(3.0835vw,18.501px)] max-[501px]:text-[3.7447vw] font-bold tracking-[0.43em] text-[#DBBA5D]">
          WHY MIRI CRUISE
        </p>
        <h2 className="text-[min(2.75vw,52.8px)] font-extrabold text-black max-[991px]:text-[min(6.9551vw,41.7306px)] max-[501px]:text-[7.4vw]">
          미리크루즈가 특별한 이유
        </h2>
        <Link
          href="/about"
          className="mt-[1.2em] inline-block rounded-none border-[1.07px] border-[#113667] px-[1.6em] py-[0.7em] text-[min(0.88vw,16.896px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-semibold text-[#113667] transition hover:bg-[#113667] hover:text-white"
        >
          미리크루즈 소개 보기
        </Link>
      </div>

      {/* 본문: 번호 탭 + 콘텐츠 (데스크톱) */}
      <div className="flex w-full max-[991px]:hidden">
        {/* 좌측 번호 (왼쪽 163/1512 = 10.7804vw, 폭 고정해 이미지 시작점 482/1512 맞춤) */}
        <div className="ml-[13.5vw] flex w-[3.5vw] shrink-0 flex-col items-center max-[991px]:ml-0 max-[991px]:w-auto max-[991px]:flex-row max-[991px]:gap-[1.5em]">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setPos(n + i);
                setTick((t) => t + 1);
              }}
              className={`py-[0.5em] text-[min(1.815vw,34.848px)] max-[991px]:text-[min(5.653vw,33.918px)] max-[501px]:text-[6.8653vw] transition ${
                i === active ? "font-semibold text-[#1E4D8B]" : "font-bold text-slate-300 hover:text-slate-400"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
          {/* 진행 라인 (2px #D9D9D9) */}
          <span className="mt-[1em] h-[5em] w-[2px] bg-[#D9D9D9] max-[991px]:hidden" />
        </div>

        {/* 우측 콘텐츠 (이미지 왼쪽 482/1512 = 31.8783vw, 오른쪽 163/1512 대칭) */}
        <div className="ml-[17.5979vw] mr-[13.5vw] min-w-0 flex-1 max-[991px]:mx-0">
          {/* 이미지 — 4개 모두 미리 렌더(프리로드)하고 활성만 표시해 클릭 즉시 전환 */}
          <div className="relative aspect-[2.6444] w-full overflow-hidden rounded-[0.6em] shadow-md">
            {FEATURES.map((feat, i) =>
              feat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={feat.imageUrl}
                  alt={feat.titleLines.join(" ")}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                    i === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              ) : (
                <div
                  key={i}
                  className={`absolute inset-0 h-full w-full bg-gradient-to-br ${feat.gradient} transition-opacity duration-300 ${
                    i === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              )
            )}
          </div>

          {/* 타이틀 + 설명 */}
          <div className="mt-[1.8em] grid grid-cols-[28em_1fr] gap-[1.5em] max-[501px]:grid-cols-1 max-[501px]:gap-[0.8em]">
            <h3 className="text-[min(2.079vw,39.9168px)] max-[991px]:text-[min(6.4754vw,38.8524px)] max-[501px]:text-[7.864vw] font-bold leading-[1.3] text-black">
              {f.titleLines[0]}
              <br />
              {f.titleLines[1]}
            </h3>
            <p className="self-start text-[min(1.4808vw,28.4314px)] max-[991px]:text-[min(4.6122vw,27.6732px)] max-[501px]:text-[5.6012vw] leading-[1.7] text-black/70">
              {f.descLines[0]}
              {f.descLines[1] && (
                <>
                  <br />
                  {f.descLines[1]}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 모바일: 가운데 1개 + 양옆 20vw 미리보기(투명도 30%) 캐러셀 */}
      <div className="hidden max-[991px]:block">
        <div className="overflow-hidden">
          <div
            className={`flex ${anim ? "transition-transform duration-500 ease-out" : ""}`}
            style={{ transform: `translateX(calc(20vw - ${pos * 60}vw))` }}
            onTransitionEnd={onSlideEnd}
          >
            {tripled.map((feat, i) => (
              <div
                key={i}
                onClick={() => {
                  setPos(i);
                  setTick((t) => t + 1);
                }}
                className={`w-[60vw] shrink-0 cursor-pointer px-[0.4em] ${anim ? "transition-opacity duration-300" : ""}`}
                style={{ opacity: i === pos ? 1 : 0.3 }}
              >
                <div className="relative aspect-[279/185] w-full overflow-hidden rounded-[0.6em] shadow-md">
                  {feat.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={feat.imageUrl} alt={feat.titleLines.join(" ")} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className={`absolute inset-0 h-full w-full bg-gradient-to-br ${feat.gradient}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 활성 항목 타이틀 + 설명 */}
        <div className="mt-[1.6em] px-[2em]">
          <h3 className="text-[min(1.694vw,32.5248px)] max-[991px]:text-[min(5.2763vw,31.6578px)] max-[501px]:text-[6.4077vw] font-bold leading-[1.35] text-black">
            {f.titleLines[0]} {f.titleLines[1]}
          </h3>
          <p className="mt-[0.6em] text-[min(1.155vw,22.176px)] max-[991px]:text-[min(3.5974vw,21.5844px)] max-[501px]:text-[4.3689vw] leading-[1.6] text-black/70">
            {f.descLines[0]}
            {f.descLines[1] && (
              <>
                <br />
                {f.descLines[1]}
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
