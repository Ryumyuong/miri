"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Voyage } from "@/lib/types";
import { groupVoyages } from "@/lib/voyage-group";
import { FILTER_REGION_OPTS, matchesRegion, normalizeFilterRegion } from "@/lib/region-filter";

function won(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

const regionGradient: Record<string, string> = {
  "미주·알래스카": "from-cyan-300 to-sky-600",
  유럽: "from-sky-400 to-indigo-700",
  중동: "from-amber-400 to-orange-700",
  동남아: "from-emerald-300 to-teal-600",
  동북아: "from-blue-300 to-slate-600",
  "리버 크루즈": "from-amber-300 to-rose-500",
};

const statusBadge: Record<string, string> = {
  "출발 확정": "bg-[#17938E]",
  "예약 가능": "bg-brand",
  "예약 중": "bg-sky-500",
  마감: "bg-slate-400",
};

const LINE_OPTS = [
  "전체",
  "MSC Cruises",
  "Royal Caribbean",
  "Costa Cruises",
  "Resorts World Cruises",
  "Victoria Cruises",
];

export default function CruiseList({ voyages }: { voyages: Voyage[] }) {
  const params = useSearchParams();
  // 동남아·동북아로 들어와도 "동남아/동북아" 칩이 선택된 상태가 되도록 정규화
  const [region, setRegion] = useState<string | null>(normalizeFilterRegion(params.get("region")));
  // 검색바·크루즈찾기에서 넘어온 from(YYYY-MM-DD)은 출발월 필터로 초기화 → UI(출발월 칩)로 변경 가능
  const [month, setMonth] = useState<string | null>(params.get("from") ? params.get("from")!.slice(0, 7) : null); // "YYYY-MM"
  const [line, setLine] = useState("전체");
  const [filterOpen, setFilterOpen] = useState(true); // 모바일 필터 접기/펴기

  // URL 파라미터(region/from)가 바뀌면(상단 메뉴 드롭다운 등) 필터 상태도 동기화
  const regionParam = params.get("region");
  const fromParam = params.get("from");
  useEffect(() => {
    setRegion(normalizeFilterRegion(regionParam));
    setMonth(fromParam ? fromParam.slice(0, 7) : null);
  }, [regionParam, fromParam]);

  // 검색에서 넘어온 인원수는 상세 페이지까지 이어준다(직접 진입 시 상세에서 1인 기본).
  const peopleQS = params.get("people") ? `?people=${params.get("people")}` : "";

  const today = new Date().toISOString().slice(0, 10);
  // 프라임 상품도 일반 목록에 함께 노출 (프라임 페이지 단독 노출 아님)

  // 등록된 상품의 출발월을 자동 생성 (지난 월 제외, 내년 이후는 'YY년 M월'로 표기)
  const todayYM = today.slice(0, 7);
  const thisYear = today.slice(0, 4);
  const monthOpts: { label: string; value: string | null }[] = [
    { label: "전체", value: null },
    ...Array.from(new Set(voyages.map((v) => v.departDate.slice(0, 7)).filter((ym) => ym >= todayYM)))
      .sort()
      .map((ym) => {
        const [y, m] = ym.split("-");
        return { label: y === thisYear ? `${Number(m)}월` : `${y.slice(2)}년 ${Number(m)}월`, value: ym };
      }),
  ];
  const filtered = voyages.filter((v) => {
    if (v.departDate < today) return false; // 출발일 지난 상품 자동 숨김
    if (!matchesRegion(v, region)) return false;
    if (month && v.departDate.slice(0, 7) !== month) return false;
    if (line !== "전체" && v.line !== line) return false;
    return true;
  });
  // 출발일마다 개별 카드로 모두 노출 (묶음 대표 1개로 접지 않음). 출발일 오름차순.
  // 단, 각 카드의 '전체보기'는 같은 크루즈(그룹)의 전체 출발일을 그대로 표시.
  const groupMembers = new Map<string, Voyage[]>();
  groupVoyages(filtered).forEach((g) => g.members.forEach((m) => groupMembers.set(m.id, g.members)));
  const cards = [...filtered]
    .sort((a, b) => a.departDate.localeCompare(b.departDate))
    .map((v) => ({ rep: v, members: groupMembers.get(v.id) ?? [v] }));

  return (
    <div className="flex w-full gap-7 px-[max(10.7143%,calc((100%_-_1920px)/2_+_162px))] max-[991px]:flex-col max-[991px]:px-5 max-[501px]:px-[4%]" style={{ fontSize: "var(--font-base)" }}>
      {/* 필터 사이드바 */}
      <aside className="sticky top-24 w-[18em] shrink-0 self-start rounded-none bg-white p-[1.8em] shadow-sm max-[991px]:static max-[991px]:w-full">
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className="mb-4 flex w-full items-center justify-between text-left max-[991px]:cursor-pointer"
        >
          <h2 className="text-[min(0.99vw,19.008px)] font-semibold text-[#0B2A4A] max-[991px]:text-[min(3.8685vw,23.211px)] max-[501px]:text-[4.698vw]">검색필터</h2>
          <svg
            viewBox="0 0 24 24"
            className={`hidden h-5 w-5 text-slate-500 transition-transform max-[991px]:block ${filterOpen ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>

        <div className={filterOpen ? "" : "max-[991px]:hidden"}>
        <FilterGroup title="지역">
          <div className="flex flex-wrap gap-1.5">
            {FILTER_REGION_OPTS.map((o) => (
              <Chip
                key={o.label}
                active={region === o.value}
                onClick={() => setRegion(o.value)}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="출발 월">
          <div className="flex flex-wrap gap-1.5">
            {monthOpts.map((o) => (
              <Chip
                key={o.label}
                active={month === o.value}
                onClick={() => setMonth(o.value)}
              >
                {o.label}
              </Chip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="크루즈 선사">
          <div className="flex flex-col gap-2">
            {LINE_OPTS.map((l) => (
              <label
                key={l}
                className={`flex cursor-pointer items-center gap-2 text-[min(0.77vw,14.784px)] max-[991px]:text-[min(3.0075vw,18.045px)] max-[501px]:text-[3.6524vw] ${
                  line === l ? "font-semibold text-[#1E4D8B]" : "font-medium text-[#0B2A4A]"
                }`}
              >
                <input
                  type="radio"
                  name="line"
                  checked={line === l}
                  onChange={() => setLine(l)}
                  className="accent-[#1E4D8B]"
                />
                {l}
              </label>
            ))}
          </div>
        </FilterGroup>
        </div>
      </aside>

      {/* 일정 리스트 */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-10">
          {cards.map(({ rep: v, members }) => {
            // 카드 헤드라인 가격은 '이 카드의 출발일(대표 v)' 자신의 상품가.
            // (같은 크루즈라도 출발일마다 요금이 달라, 그룹 최저가로 뭉뚱그리지 않는다)
            const cardPrice = v.priceFrom > 0 ? v.priceFrom : 0;
            const multi = members.length > 1;
            return (
            <article
              key={v.id}
              className="group flex flex-col rounded-none bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(11,42,74,0.35)]"
            >
             <Link href={`/cruises/${v.id}${peopleQS}`} className="flex gap-8 p-8 max-[991px]:flex-col max-[991px]:gap-5 max-[501px]:p-0">
              {/* 썸네일 (카드 안쪽 inset + 라운드, 1:1 고정) — 접은 모바일에선 좌우 꽉 채우고 라운드 제거 */}
              <div className="relative aspect-square w-[22em] shrink-0 self-start overflow-hidden rounded-[10px] max-[991px]:w-full max-[501px]:rounded-none">
                {v.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className={`h-full w-full bg-gradient-to-br ${
                      regionGradient[v.region] ?? "from-sky-400 to-blue-700"
                    }`}
                  />
                )}
                {multi ? (
                  <span className="absolute left-3 top-3 rounded-[4px] bg-brand px-2 py-0.5 text-[min(0.7337vw,14.087px)] max-[991px]:text-[min(2.2853vw,13.7118px)] max-[501px]:text-[2.7754vw] font-semibold text-white">
                    출발일 {members.length}개
                  </span>
                ) : (
                  <span
                    className={`absolute left-3 top-3 rounded-[4px] px-2 py-0.5 text-[min(0.7337vw,14.087px)] max-[991px]:text-[min(2.2853vw,13.7118px)] max-[501px]:text-[2.7754vw] font-semibold text-white ${
                      statusBadge[v.status] ?? "bg-slate-500"
                    }`}
                  >
                    {v.status}
                  </span>
                )}
              </div>

              {/* 내용 */}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 max-[501px]:px-[32px] max-[501px]:pb-6">
                <div>
                  <span className="inline-block rounded-[4px] border-[0.5px] border-[#C9A961] bg-transparent px-[0.9em] py-[0.35em] text-[min(0.7902vw,15.1718px)] max-[991px]:text-[min(2.4611vw,14.7666px)] max-[501px]:text-[2.9889vw] font-medium text-[#C9A961]">
                    {v.region}
                  </span>
                  <h3 className="mt-3 line-clamp-3 min-h-[4.125em] whitespace-pre-line text-[min(1.32vw,25.344px)] max-[991px]:text-[min(4.1114vw,24.6684px)] max-[501px]:text-[4.9931vw] font-bold leading-snug text-[#000000]">
                    {v.title}
                  </h3>
                  <ul className="mt-4 flex flex-col gap-2 text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] text-slate-500">
                    {/* eslint-disable @next/next/no-img-element */}
                    <li className="flex items-center gap-2 text-[1.1429em]">
                      <img src="/icons/card/location.png" alt="" className="h-4 w-4 shrink-0 object-contain" />
                      {v.shipName} · {v.line}
                    </li>
                    <li className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <span className="flex items-center gap-2">
                        <img src="/icons/card/calendar.png" alt="" className="h-4 w-4 shrink-0 object-contain" />
                        <span>
                          {v.departDate} 출발 · {v.nights}박 {v.days}일
                          {multi && <span className="text-brand"> · 외 {members.length - 1}개 출발일</span>}
                        </span>
                      </span>
                    </li>
                    {/* eslint-enable @next/next/no-img-element */}
                  </ul>
                </div>

                <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
                  <div>
                    {cardPrice > 0 ? (
                      <>
                        <p className="text-[min(0.66vw,12.672px)] max-[991px]:text-[min(2.0556vw,12.3336px)] max-[501px]:text-[2.4964vw] text-slate-400">상품가 (성인 1인 기준)</p>
                        <p className="text-[min(1.4216vw,27.2947px)] max-[991px]:text-[min(4.4277vw,26.5662px)] max-[501px]:text-[5.3772vw] font-semibold text-[#0B2A4A]">{won(cardPrice)}~</p>
                      </>
                    ) : (
                      <p className="text-[min(1.4216vw,27.2947px)] max-[991px]:text-[min(4.4277vw,26.5662px)] max-[501px]:text-[5.3772vw] font-semibold text-[#0B2A4A]">요금문의</p>
                    )}
                  </div>
                  <span className="shrink-0 whitespace-nowrap rounded-none bg-navy px-[3.8em] py-[0.9em] text-center text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-semibold text-white transition group-hover:bg-navy-dark max-[501px]:px-[2.2em]">
                    상세보기
                  </span>
                </div>
              </div>
             </Link>

              {/* 여러 출발일: 회색 바 클릭 시 펼침 */}
              {multi && (
                <details className="group border-t border-slate-100">
                  <summary className="flex cursor-pointer list-none items-center justify-center gap-2 bg-slate-50 py-3.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 transition hover:bg-slate-100 [&::-webkit-details-marker]:hidden">
                    출발일 {members.length}개 전체보기
                    <span className="text-[1.0714em] transition group-open:rotate-180">▼</span>
                  </summary>
                  <ul className="divide-y divide-slate-100 border-t border-slate-100">
                    {members.map((m) => {
                      const closed = m.departDate < today || m.status === "마감";
                      const label = closed
                        ? "마감"
                        : m.priceFrom > 0
                          ? `${won(m.priceFrom)}~`
                          : "요금문의";
                      const dateCls = closed ? "text-slate-400" : "text-slate-600";
                      const priceCls = closed ? "font-bold text-slate-400" : "font-bold text-navy";
                      return (
                      <li key={m.id}>
                        {!closed && m.priceFrom > 0 ? (
                          <Link
                            href={`/cruises/${m.id}${peopleQS}`}
                            className="flex items-center justify-between gap-3 px-8 py-3.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] transition hover:bg-slate-50"
                          >
                            <span className={dateCls}>📅 {m.departDate} 출발 · {m.nights}박 {m.days}일</span>
                            <span className={priceCls}>{label}</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => alert("예약가능한 일정이 없습니다.")}
                            className="flex w-full items-center justify-between gap-3 px-8 py-3.5 text-left text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] transition hover:bg-slate-50"
                          >
                            <span className={dateCls}>📅 {m.departDate} 출발 · {m.nights}박 {m.days}일</span>
                            <span className={priceCls}>{label}</span>
                          </button>
                        )}
                      </li>
                      );
                    })}
                  </ul>
                </details>
              )}
            </article>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
              조건에 맞는 일정이 없습니다. 필터를 변경해보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 border-t border-[#0B2A4A]/10 pt-4 first:border-t-0 first:pt-0">
      <p className="mb-2.5 text-[min(0.77vw,14.784px)] font-bold text-[#0B2A4A] max-[991px]:text-[min(3.0075vw,18.045px)] max-[501px]:text-[3.6524vw]">{title}</p>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2.5 py-1 text-[min(0.77vw,14.784px)] transition max-[991px]:text-[min(3.0075vw,18.045px)] max-[501px]:text-[3.6524vw] ${
        active
          ? "bg-[#1E4D8B] font-semibold text-white"
          : "bg-[#F2F4F7] font-medium text-[#0B2A4A] hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
