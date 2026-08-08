"use client";

import { useState } from "react";
import { useReviews } from "@/lib/useReviews";
import { deleteReview, updateReview } from "@/lib/reviews";
import type { Review } from "@/lib/types";
import ReviewGallery from "@/components/site/ReviewGallery";
import { matchesReviewCategory } from "@/lib/region-filter";

const CATEGORIES = ["전체", "유럽", "미주·알래스카", "중동", "동남아/동북아"];

export default function ReviewManager() {
  const { reviews, loading } = useReviews();
  const [cat, setCat] = useState("전체");
  const [viewing, setViewing] = useState<Review | null>(null);
  const [moving, setMoving] = useState(false);

  const shown = cat === "전체" ? reviews : reviews.filter((r) => matchesReviewCategory(r.category, cat));

  const remove = async (id: string, title: string) => {
    if (confirm(`"${title}" 후기를 삭제할까요?`)) await deleteReview(id);
  };

  // 노출 순서 이동 — 현재 보이는 목록에서 인접 후기와 순서를 맞바꿈
  const move = async (id: string, dir: "up" | "down") => {
    const sIdx = shown.findIndex((r) => r.id === id);
    const neighbor = dir === "up" ? shown[sIdx - 1] : shown[sIdx + 1];
    if (!neighbor || moving) return;
    setMoving(true);
    try {
      // 전체 목록을 현재 정렬 순서대로 order=index 로 정규화하되, 두 항목만 맞바꿈
      const ai = reviews.findIndex((r) => r.id === id);
      const bi = reviews.findIndex((r) => r.id === neighbor.id);
      await Promise.all(
        reviews
          .map((r, idx) => {
            const target = r.id === id ? bi : r.id === neighbor.id ? ai : idx;
            return r.order !== target ? updateReview(r.id, { order: target }) : null;
          })
          .filter(Boolean) as Promise<void>[],
      );
    } finally {
      setMoving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">후기 관리</h1>
        <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">고객 후기를 확인·정렬·삭제할 수 있습니다 · 총 {reviews.length}건</p>
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-lg px-3 py-1.5 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-semibold transition ${
              cat === c ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          후기가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full table-fixed text-[min(0.9075vw,17.424px)] max-[991px]:table-auto max-[991px]:whitespace-nowrap max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-center text-slate-500">
                <th className="w-[10rem] whitespace-nowrap px-4 py-3 font-semibold max-[991px]:w-[16rem]">이미지</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">제목 / 지역</th>
                <th className="w-20 whitespace-nowrap px-4 py-3 font-semibold max-[991px]:hidden">작성자</th>
                <th className="w-16 whitespace-nowrap px-4 py-3 font-semibold max-[991px]:hidden">평점</th>
                <th className="w-16 whitespace-nowrap px-4 py-3 font-semibold max-[991px]:hidden">조회</th>
                <th className="w-32 whitespace-nowrap px-4 py-3 font-semibold max-[991px]:hidden">작성일</th>
                <th className="w-28 whitespace-nowrap px-4 py-3 font-semibold">순서</th>
                <th className="w-36 whitespace-nowrap px-4 py-3 font-semibold">관리</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 max-[991px]:min-w-[10rem]">
                    {r.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imageUrl} alt="" className="h-20 w-full rounded-md object-cover" />
                    ) : (
                      <div className="grid h-20 w-full place-items-center rounded-md bg-slate-100 text-slate-400">—</div>
                    )}
                  </td>
                  <td className="w-full px-4 py-3">
                    <p className="line-clamp-1 font-semibold text-slate-800">{r.title}</p>
                    <p className="line-clamp-1 text-[0.9em] text-gold">{r.category} · {r.region} {r.ship}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 max-[991px]:hidden">{r.author}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-slate-600 max-[991px]:hidden">⭐ {r.rating}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-slate-500 max-[991px]:hidden">{r.views}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500 max-[991px]:hidden">{r.date}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => move(r.id, "up")}
                        disabled={i === 0 || moving}
                        title="위로"
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-[0.9em] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => move(r.id, "down")}
                        disabled={i === shown.length - 1 || moving}
                        title="아래로"
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-[0.9em] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setViewing(r)}
                        className="whitespace-nowrap rounded-md border border-slate-300 px-3 py-1.5 text-[0.9em] font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        👁 보기
                      </button>
                      <button
                        onClick={() => remove(r.id, r.title)}
                        className="whitespace-nowrap rounded-md border border-red-200 px-3 py-1.5 text-[0.9em] font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        🗑 삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setViewing(null)}>
          <div className="w-full max-w-[640px] overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-slate-700 px-5 py-3 text-white">
              <h3 className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold">여행 후기</h3>
              <button onClick={() => setViewing(null)} className="text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] leading-none hover:opacity-80">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <p className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">{viewing.title}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-500">
                <span className="text-gold">{"⭐".repeat(viewing.rating)} {viewing.rating}.0</span>
                <span>· {viewing.author}</span>
                <span>· {viewing.category} · {viewing.region} {viewing.ship}</span>
                <span>· {viewing.date}</span>
                <span>· 조회 {viewing.views}</span>
              </div>
              {(viewing.travelDate || viewing.travelDest) && (
                <p className="mt-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                  {viewing.travelDate && `여행일 ${viewing.travelDate}`}
                  {viewing.travelDate && viewing.travelDest && " · "}
                  {viewing.travelDest && `여행지 ${viewing.travelDest}`}
                </p>
              )}

              <p className="mt-4 whitespace-pre-line text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-700">{viewing.content || "내용이 없습니다."}</p>

              {(() => {
                const imgs = viewing.images?.length ? viewing.images : viewing.imageUrl ? [viewing.imageUrl] : [];
                return imgs.length ? (
                  <div className="mt-5">
                    <p className="mb-2 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-bold text-slate-700">첨부 이미지</p>
                    <ReviewGallery images={imgs} alt={viewing.title} />
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
