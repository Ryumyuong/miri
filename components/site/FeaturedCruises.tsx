"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Voyage } from "@/lib/types";
import ConsultButton from "@/components/site/ConsultButton";

function won(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

const PER_PAGE = 3;
const pad = (n: number) => String(n).padStart(2, "0");

// 카드 썸네일이 없을 때 지역별 그라데이션 자리표시자
const regionGradient: Record<string, string> = {
  "미주·알래스카": "from-cyan-200 to-sky-500",
  유럽: "from-orange-200 to-amber-500",
  동남아: "from-rose-300 to-orange-400",
  중동: "from-amber-200 to-yellow-600",
  동북아: "from-sky-200 to-blue-500",
};

type Group = { rep: Voyage; members: Voyage[] };

export default function FeaturedCruises({ groups }: { groups: Group[] }) {
  // 모바일(≤990px)에선 1개씩, 데스크톱에선 3개씩
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 990px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const perPage = isMobile ? 1 : PER_PAGE;

  // 모든 카드를 트랙에 한 번에 렌더(이미지 최초 1회 로드 후 유지)
  const chunks: Group[][] = [];
  for (let i = 0; i < groups.length; i += perPage) chunks.push(groups.slice(i, i + perPage));
  const realPages = Math.max(1, chunks.length);
  const loop = realPages > 1;
  // 끝에서 처음으로 넘어갈 때도 오른쪽(앞) 방향을 유지하도록 첫 페이지를 끝에 복제
  const slides = loop ? [...chunks, chunks[0]] : chunks;

  const [pos, setPos] = useState(0); // 트랙 위치(복제 포함 0..realPages)
  const [anim, setAnim] = useState(true); // 복제→원본 스냅백 순간엔 트랜지션 끔
  const [tick, setTick] = useState(0); // 수동 조작 시 자동 타이머를 0초부터 재시작
  const cur = pos % realPages; // 표시용 현재 페이지
  const next = () => {
    setPos((p) => p + 1);
    setTick((t) => t + 1); // 자동 슬라이드 타이머 리셋(0초부터 다시)
  };

  // perPage 바뀌면(리사이즈) 위치 초기화
  useEffect(() => {
    setPos(0);
    setAnim(true);
  }, [perPage]);

  // 자동 순환 — 4초마다 오른쪽으로 한 칸 (수동 조작 시 tick 변경 → 타이머 0초부터 리셋)
  useEffect(() => {
    if (!loop) return;
    const id = setInterval(() => setPos((p) => p + 1), 4000);
    return () => clearInterval(id);
  }, [loop, tick]);

  // 복제 페이지(pos===realPages)까지 슬라이드가 끝나면 트랜지션 없이 0으로 스냅 → 끊김 없는 무한 전진
  const handleEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    if (pos === realPages) {
      setAnim(false);
      setPos(0);
    }
  };
  // 스냅 후 다음 프레임에 트랜지션 복구
  useEffect(() => {
    if (anim) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)));
    return () => cancelAnimationFrame(r);
  }, [anim]);

  return (
    <section
      id="schedules"
      className="w-full px-[max(10.3175%,calc((100%_-_1920px)/2_+_156px))] max-[991px]:px-[7%] max-[991px]:pt-52"
      style={{ fontSize: "var(--font-base)" }}
    >
      {/* 섹션 헤더 */}
      <div className="mb-14 flex flex-wrap items-end justify-between gap-4 max-[991px]:mb-8">
        <div>
          <h2 className="text-[min(2.75vw,52.8px)] font-extrabold tracking-tight max-[991px]:text-[min(6.9551vw,41.7306px)] max-[501px]:text-[7.4vw]">
            <span className="text-[#1E4D8B]">기다림 없는</span>{" "}
            <span className="text-[#04051E]">크루즈</span>
          </h2>
          <p className="mt-3 text-[min(1.32vw,25.344px)] max-[991px]:text-[min(3.8vw,22.8px)] max-[501px]:text-[3.7vw] font-medium text-[#242424]">
            지금 바로 탑승 가능한 프리미엄 크루즈 일정을 소개합니다
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] text-slate-400 max-[991px]:hidden">
            <span className="font-semibold text-slate-700">{pad(cur + 1)}</span><span className="mx-1.5">/</span>{pad(realPages)}
          </span>
          {/* 앞으로(오른쪽)만 이동 */}
          <div className="flex gap-1.5 max-[991px]:hidden">
            <button type="button" aria-label="다음" onClick={next} className="transition hover:opacity-80">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/page-next.png" alt="" className="h-9 w-9 object-contain" />
            </button>
          </div>
          <Link
            href="/cruises"
            className="ml-4 rounded-none bg-[#113667] px-7 py-2.5 text-[min(0.88vw,16.896px)] font-semibold text-white transition hover:brightness-125 max-[991px]:ml-0 max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]"
          >
            전체일정보기
          </Link>
        </div>
      </div>

      {/* 카드 캐러셀 — 전체를 트랙에 깔고 오른쪽으로만 슬라이드(재로딩 없음) */}
      <div className="relative">
        {/* 모바일 다음(오른쪽) 화살표만 */}
        <button
          type="button"
          aria-label="다음"
          onClick={next}
          className="absolute right-0 top-1/2 z-10 hidden translate-x-[150%] -translate-y-1/2 transition hover:opacity-70 max-[991px]:block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/carousel-next.png" alt="" className="h-7 w-auto object-contain" />
        </button>

        <div className="overflow-hidden">
          <div
            className="flex"
            style={{
              transform: `translateX(-${pos * 100}%)`,
              transition: anim ? "transform 500ms ease-out" : "none",
            }}
            onTransitionEnd={handleEnd}
          >
            {slides.map((chunk, pi) => (
              <div key={pi} className="grid w-full shrink-0 gap-8 grid-cols-3 max-[991px]:!grid-cols-1">
                {chunk.map(({ rep: v, members }) => (
                  <CruiseCard key={v.id} v={v} members={members} eager={pi === 0} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CruiseCard({ v, members, eager }: { v: Voyage; members: Voyage[]; eager?: boolean }) {
  const priced = members.map((m) => m.priceFrom).filter((p) => p > 0);
  const minPrice = priced.length ? Math.min(...priced) : 0;
  const multi = members.length > 1;
  return (
    <article className="group overflow-hidden rounded-none border border-black/20 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(11,42,74,0.35)]">
      {/* 썸네일 */}
      <div className="relative aspect-[376/235] w-full overflow-hidden">
        {v.thumbnail ? (
          // 첫 페이지는 즉시 로드(초기 표시 빠르게), 나머지는 lazy → 한 번 로드되면 유지
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={v.thumbnail}
            alt={v.title}
            loading={eager ? "eager" : "lazy"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`h-full w-full bg-gradient-to-br ${
              regionGradient[v.region] ?? "from-sky-200 to-blue-400"
            }`}
          />
        )}
        {/* 좌상단 뱃지 2단 (가로 길이 동일) */}
        <div className="absolute left-3 top-3 flex flex-col items-stretch gap-1.5">
          {multi ? (
            <span className="flex items-center justify-center gap-1 rounded-[999px] bg-[#000B1B]/[0.72] px-3 py-1 text-[min(0.66vw,12.672px)] font-semibold text-white backdrop-blur max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]">
              출발일 {members.length}개
            </span>
          ) : (
            v.dDay != null && v.dDay >= 0 && (
              <span className="flex items-center justify-center gap-1 rounded-[999px] bg-[#000B1B]/[0.72] px-3 py-1 text-[min(0.66vw,12.672px)] font-semibold text-white backdrop-blur max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/clock.png" alt="" className="h-3 w-3 object-contain" />
                D-{v.dDay}
              </span>
            )
          )}
          <span className="flex items-center justify-center rounded-[999px] bg-[#000B1B]/[0.72] px-3 py-1 text-[min(0.66vw,12.672px)] font-medium text-white backdrop-blur max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]">
            {v.region}
          </span>
        </div>
      </div>

      {/* 본문 */}
      <div className="p-4">
        <h3 className="line-clamp-3 min-h-[4.125em] whitespace-pre-line text-[min(0.99vw,19.008px)] font-semibold leading-snug text-[#0B2A4A] max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]">
          {v.title}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-[min(0.77vw,14.784px)] text-[#5A6B7E] max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/calendar.png" alt="" className="h-3.5 w-3.5 object-contain" />
          {v.departDate} · {v.nights}박 {v.days}일
          {multi && <span className="text-brand"> · 외 {members.length - 1}개</span>}
        </p>

        {minPrice > 0 ? (
          <>
            <p className="mt-3 text-[min(0.66vw,12.672px)] text-[#5A6B7E] max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]">상품가 (성인 1인 기준)</p>
            <p className="text-[min(1.32vw,25.344px)] font-semibold text-[#0B2A4A] max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw] max-[501px]:text-[2.9126vw]">{won(minPrice)}~</p>
          </>
        ) : (
          <p className="mt-3 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-black text-red-500">요금문의</p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/cruises/${v.id}`}
            className="flex items-center justify-center rounded-none bg-[#113667] py-2.5 text-center text-[min(0.77vw,14.784px)] font-semibold text-white transition hover:brightness-125 max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]"
          >
            상세보기
          </Link>
          <ConsultButton
            voyageTitle={v.title}
            className="flex items-center justify-center rounded-none border border-[#113667] py-2.5 text-center text-[min(0.77vw,14.784px)] font-semibold text-[#113667] transition hover:bg-[#113667] hover:text-white max-[991px]:text-[min(3.1418vw,18.8508px)] max-[501px]:text-[3.8155vw]"
          >
            예약문의
          </ConsultButton>
        </div>
      </div>
    </article>
  );
}
