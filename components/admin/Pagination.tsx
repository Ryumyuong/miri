"use client";

/** 관리자 목록 페이징 — total/pageSize/page 기반. 페이지가 1개 이하면 렌더 안 함. */
export default function Pagination({
  total,
  pageSize,
  page,
  onPage,
}: {
  total: number;
  pageSize: number;
  page: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const go = (p: number) => onPage(Math.min(pages, Math.max(1, p)));

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5 text-[min(0.7219vw,13.8605px)] max-[991px]:text-[min(2.2484vw,13.4904px)] max-[501px]:text-[2.7306vw]">
      <button
        onClick={() => go(page - 1)}
        disabled={page === 1}
        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
        aria-label="이전"
      >
        ‹
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => go(p)}
          className={`grid h-8 min-w-[2rem] place-items-center rounded-lg px-2 font-semibold transition ${
            p === page ? "bg-[#1E4D8B] text-white" : "border border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => go(page + 1)}
        disabled={page === pages}
        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
        aria-label="다음"
      >
        ›
      </button>
    </div>
  );
}
