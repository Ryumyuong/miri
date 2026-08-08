"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Review } from "@/lib/types";
import { matchesReviewCategory } from "@/lib/region-filter";

const CATEGORIES = ["전체", "유럽", "미주·알래스카", "중동", "동남아/동북아"];

const regionGradient: Record<string, string> = {
  유럽: "from-sky-400 to-indigo-700",
  "미주·알래스카": "from-cyan-300 to-sky-600",
  중동: "from-amber-400 to-orange-700",
  동북아: "from-blue-300 to-slate-600",
  동남아: "from-emerald-300 to-teal-600",
  "동남아/동북아": "from-emerald-300 to-teal-600",
  장강크루즈: "from-amber-300 to-rose-500",
};

const PER_PAGE = 6;

export default function ReviewsBoard({ reviews, onWrite }: { reviews: Review[]; onWrite?: () => void }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("전체");
  const [page, setPage] = useState(1);
  const router = useRouter();

  // 후기 클릭 → 후기 상세페이지로 이동 (조회수 증가는 상세페이지에서 처리)
  const openReview = (r: Review) => {
    router.push(`/reviews/${r.id}`);
  };

  const filtered = reviews.filter((r) => {
    if (cat !== "전체" && !matchesReviewCategory(r.category, cat)) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${r.title} ${r.content} ${r.author} ${r.region}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, pageCount);
  const shown = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const reset = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="w-full px-[max(10.7143%,calc((100%_-_1920px)/2_+_162px))] max-[991px]:px-[6%] max-[501px]:px-[5%]" style={{ fontSize: "var(--font-base)" }}>
      {/* 검색 + 필터 */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[14rem]">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <svg viewBox="0 0 24 24" className="h-[1.3em] w-[1.3em]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => reset(() => setQuery(e.target.value))}
            placeholder="후기 검색..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] outline-none focus:border-brand"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => reset(() => setCat(c))}
              className={`rounded-none px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-medium transition ${
                cat === c
                  ? "bg-[#1E4D8B] text-white"
                  : "bg-[#F2F4F7] text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">
        총 <span className="font-bold text-brand">{filtered.length}</span>개의 후기
      </p>

      {/* 후기 그리드 */}
      <div className="mt-4 grid grid-cols-3 gap-6 max-[991px]:grid-cols-1">
        {shown.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => openReview(r)}
            className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(11,42,74,0.35)]"
          >
            {/* 이미지 + 권역 뱃지 */}
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              {r.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br ${
                    regionGradient[r.category] ?? "from-sky-400 to-blue-700"
                  }`}
                />
              )}
              <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-medium text-white backdrop-blur">
                {r.category}
              </span>
            </div>

            {/* 본문 */}
            <div className="flex flex-1 flex-col p-5">
              <Stars rating={r.rating} />
              <h3 className="mt-2 line-clamp-1 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">{r.title}</h3>
              <p className="mt-2 line-clamp-3 text-[min(0.935vw,17.952px)] max-[991px]:text-[min(2.9123vw,17.4738px)] max-[501px]:text-[3.5368vw] leading-relaxed text-slate-500">
                {r.content}
              </p>
              <p className="mt-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-gold">
                {r.region} {r.ship}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
                <span className="font-semibold text-slate-600">
                  {r.author} · {r.date}
                </span>
                <span>👁 {r.views}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          검색 결과가 없습니다.
        </div>
      )}

      {/* 페이지네이션 (6개 단위) + 후기 작성 버튼(오른쪽 끝, 화살표는 가운데 유지) */}
      {(pageCount > 1 || onWrite) && (
        <div className="relative mt-10 flex items-center justify-center gap-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] max-[501px]:flex-col max-[501px]:gap-4">
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={cur === 1}
                className="rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-600 transition enabled:hover:border-brand enabled:hover:text-brand disabled:opacity-40"
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-10 w-10 rounded-md font-semibold transition ${
                    p === cur ? "bg-navy text-white" : "border border-slate-300 text-slate-600 hover:border-brand hover:text-brand"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={cur === pageCount}
                className="rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-600 transition enabled:hover:border-brand enabled:hover:text-brand disabled:opacity-40"
              >
                ›
              </button>
            </div>
          )}
          {/* ≥501px: 화살표 행 오른쪽 끝(absolute). 접은 모바일: 페이징 아래 오른쪽 정렬 */}
          {onWrite && (
            <button
              onClick={onWrite}
              className="absolute right-0 rounded-lg bg-navy px-5 py-2.5 font-bold text-white transition hover:bg-navy-dark max-[501px]:static max-[501px]:self-end"
            >
              ✎ 후기 작성
            </button>
          )}
        </div>
      )}

    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] tracking-tight text-gold">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? "text-gold" : "text-slate-300"}>
          ★
        </span>
      ))}
    </p>
  );
}

