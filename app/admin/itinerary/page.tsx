"use client";

import { useState } from "react";
import Link from "next/link";
import { useVoyages } from "@/lib/useVoyages";
import { FILTER_REGION_OPTS, matchesRegion } from "@/lib/region-filter";
import Pagination from "@/components/admin/Pagination";

export default function ItineraryAdminPage() {
  const { voyages, loading } = useVoyages();
  // 운항 일정 1개당 여행일정 1개 — 그룹 묶음 없이 상품별로 나열
  const sorted = [...voyages].sort((a, b) => a.departDate.localeCompare(b.departDate));
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [region, setRegion] = useState<string | null>(null); // 권역 필터 (/cruises와 동일)
  const [month, setMonth] = useState<string | null>(null); // 출항월 필터 (null=전체, "YYYY-MM")
  const regionFiltered = sorted.filter((v) => matchesRegion(v, region));
  // 선택한 권역 안에 실제로 존재하는 출항월만 노출
  const monthOpts = [...new Set(regionFiltered.map((v) => v.departDate.slice(0, 7)).filter(Boolean))].sort();
  const list = regionFiltered.filter((v) => !month || v.departDate.slice(0, 7) === month);
  const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">여행 일정 관리</h1>
      <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
        운항 일정마다 여행일정을 각각 작성·편집합니다. (상품 1개당 일정 1개)
      </p>

      {/* 권역 필터 */}
      {!loading && sorted.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-1.5">
          {FILTER_REGION_OPTS.map((opt) => {
            const count = sorted.filter((v) => matchesRegion(v, opt.value)).length;
            const active = region === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => { setRegion(opt.value); setMonth(null); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-semibold transition ${
                  active ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 출항월 필터 (선택한 권역 기준) */}
      {!loading && monthOpts.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-400">출항월</span>
          {[null, ...monthOpts].map((m) => {
            const count = m ? regionFiltered.filter((v) => v.departDate.slice(0, 7) === m).length : regionFiltered.length;
            const active = month === m;
            return (
              <button
                key={m ?? "all"}
                onClick={() => { setMonth(m); setPage(1); }}
                className={`rounded-lg border px-2.5 py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold transition ${
                  active ? "border-brand bg-brand/10 text-brand" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {m ? `${m.slice(0, 4)}년 ${Number(m.slice(5, 7))}월` : "전체"} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : sorted.length === 0 ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          운항 일정이 없습니다. 먼저 운항 일정을 등록하세요.
        </p>
      ) : list.length === 0 ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          <b>{FILTER_REGION_OPTS.find((o) => o.value === region)?.label ?? "선택한"}</b> 권역
          {month && <> · <b>{month.slice(0, 4)}년 {Number(month.slice(5, 7))}월</b> 출항</>} 일정이 없습니다.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {paged.map((v) => {
            const dayCount = v.itineraryDays?.length ?? 0;
            return (
              <div
                key={v.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-semibold text-slate-700">{v.title}</p>
                  <p className="mt-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                    {v.code ?? "코드 미지정"} · {v.shipName} · 출항 {v.departDate} ·{" "}
                    {dayCount > 0 ? (
                      <span className="font-semibold text-[#1E4D8B]">
                        일정 {dayCount}일차 {v.itineraryStatus === "published" ? "· 발행됨" : "· 임시저장(미노출)"}
                      </span>
                    ) : (
                      <span className="text-slate-400">일정 미작성</span>
                    )}
                  </p>
                </div>
                <Link
                  href={`/admin/voyages/${v.id}/itinerary`}
                  className="shrink-0 rounded-lg bg-[#1E4D8B] px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white transition hover:brightness-110"
                >
                  {dayCount > 0 ? "일정 편집" : "일정 작성"}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      <Pagination total={list.length} pageSize={PAGE_SIZE} page={page} onPage={setPage} />
    </div>
  );
}
