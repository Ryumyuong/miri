"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ReviewForm from "@/components/site/ReviewForm";
import ReviewGallery from "@/components/site/ReviewGallery";
import { useReviews } from "@/lib/useReviews";
import { incrementReviewViews, deleteReview } from "@/lib/reviews";

export default function ReviewDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { reviews, loading } = useReviews();
  const review = reviews.find((r) => r.id === id);
  const [editing, setEditing] = useState(false);

  // 로그인 상태(localStorage) — 관리자 / 본인 계정 판정
  const [auth, setAuth] = useState<{ admin: boolean; uid: string | null }>({ admin: false, uid: null });
  useEffect(() => {
    setAuth({ admin: localStorage.getItem("miri-admin") === "1", uid: localStorage.getItem("miri-user-id") });
  }, []);
  const canManage = auth.admin || (!!auth.uid && !!review?.userId && review.userId === auth.uid);

  const remove = async () => {
    if (!review) return;
    if (!confirm("이 후기를 삭제할까요?")) return;
    await deleteReview(review.id);
    router.push("/reviews");
  };

  // 조회수 1회 증가 (id 당 한 번)
  const counted = useRef<string | null>(null);
  useEffect(() => {
    if (review && counted.current !== review.id) {
      counted.current = review.id;
      incrementReviewViews(review.id);
    }
  }, [review]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9]">
      <SiteHeader solid />

      <main className="flex-1 pt-40 pb-32 max-[991px]:pt-24 max-[991px]:pb-16" style={{ fontSize: "var(--font-base)" }}>
        <div className="mx-auto w-full max-w-[64rem] px-5">
          {loading ? (
            <p className="py-24 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
          ) : !review ? (
            <div className="py-24 text-center">
              <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">후기를 찾을 수 없습니다.</p>
              <Link href="/reviews" className="mt-4 inline-block text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-brand hover:underline">
                ← 여행후기 목록
              </Link>
            </div>
          ) : (
            <>
              <Link href="/reviews" className="mb-5 inline-block text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.2039vw] font-semibold text-slate-500 hover:text-navy">
                ← 여행후기 목록
              </Link>

              {/* 제목 카드 */}
              <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-sm max-[501px]:px-5">
                <h1 className="text-[min(1.848vw,35.4816px)] max-[991px]:text-[min(5.7559vw,34.5354px)] font-extrabold leading-snug text-black max-[501px]:text-[5.5339vw]">
                  {review.title}
                </h1>
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[min(0.8855vw,17.0016px)] max-[991px]:text-[min(2.758vw,16.548px)] max-[501px]:text-[3.3495vw] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Icon path="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
                      {review.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon path="M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
                      {review.date}
                    </span>
                    <span className="tracking-tight text-gold">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className={i < review.rating ? "text-gold" : "text-slate-300"}>★</span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>

              {/* 여행지 · 여행일 */}
              <div className="mt-4 grid grid-cols-2 gap-4 max-[501px]:grid-cols-1">
                <InfoBox label="여행지" value={review.travelDest || review.region || "—"} />
                <InfoBox label="여행일" value={review.travelDate || review.date || "—"} />
              </div>

              {/* 본문 */}
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-8 py-7 max-[501px]:px-5">
                <p className="whitespace-pre-line text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-[1.9] text-slate-700">
                  {review.content}
                </p>
              </div>

              {/* 첨부 이미지 */}
              {(() => {
                const imgs = review.images?.length ? review.images : review.imageUrl ? [review.imageUrl] : [];
                return imgs.length > 0 ? (
                  <div className="mt-8">
                    <h2 className="mb-3 flex items-center gap-2 text-[min(1.0395vw,19.9584px)] max-[991px]:text-[min(3.2377vw,19.4262px)] max-[501px]:text-[3.932vw] font-bold text-navy">
                      <span className="h-[1.1em] w-[0.28em] rounded-full bg-[#1E4D8B]" />
                      첨부 이미지
                    </h2>
                    <ReviewGallery images={imgs} alt={review.title} />
                  </div>
                ) : null;
              })()}

              {/* 하단 버튼 — 수정/삭제는 관리자 또는 본인만 */}
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link href="/reviews" className="rounded-lg bg-slate-500 px-8 py-3 text-[min(0.8855vw,17.0016px)] max-[991px]:text-[min(2.758vw,16.548px)] max-[501px]:text-[3.3495vw] font-semibold text-white transition hover:bg-slate-600">
                  목록으로
                </Link>
                {canManage && (
                  <>
                    <button onClick={() => setEditing(true)} className="rounded-lg bg-[#F5B301] px-8 py-3 text-[min(0.8855vw,17.0016px)] max-[991px]:text-[min(2.758vw,16.548px)] max-[501px]:text-[3.3495vw] font-semibold text-white transition hover:brightness-105">
                      수정
                    </button>
                    <button onClick={remove} className="rounded-lg bg-[#E4576B] px-8 py-3 text-[min(0.8855vw,17.0016px)] max-[991px]:text-[min(2.758vw,16.548px)] max-[501px]:text-[3.3495vw] font-semibold text-white transition hover:brightness-105">
                      삭제
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {editing && review && (
        <ReviewForm initial={review} onClose={() => setEditing(false)} onSubmitted={() => setEditing(false)} />
      )}

      <SiteFooter />
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.1em] w-[1.1em] shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-l-4 border-[#1E4D8B] bg-[#EEF3FB] px-6 py-4">
      <p className="text-[min(0.8085vw,15.5232px)] max-[991px]:text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.0582vw] font-semibold text-[#1E4D8B]">{label}</p>
      <p className="mt-1 text-[min(1.0395vw,19.9584px)] max-[991px]:text-[min(3.2377vw,19.4262px)] max-[501px]:text-[3.932vw] font-medium text-slate-800">{value}</p>
    </div>
  );
}

