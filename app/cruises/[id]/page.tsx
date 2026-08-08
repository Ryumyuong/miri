"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import CruiseBooking from "@/components/site/CruiseBooking";
import FinalCta from "@/components/site/FinalCta";
import ShareMenu from "@/components/site/ShareMenu";
import PhoneConsult from "@/components/site/PhoneConsult";
import ConsultButton from "@/components/site/ConsultButton";
import { useVoyages } from "@/lib/useVoyages";
import { useReservations } from "@/lib/useReservations";
import { isPastVoyage } from "@/lib/voyage-group";

const regionGradient: Record<string, string> = {
  "미주·알래스카": "from-cyan-300 to-sky-600",
  유럽: "from-sky-400 to-indigo-700",
  중동: "from-amber-400 to-orange-700",
  동남아: "from-emerald-300 to-teal-600",
  동북아: "from-blue-300 to-slate-600",
  "리버 크루즈": "from-amber-300 to-rose-500",
};

const statusBadge: Record<string, string> = {
  "출발 확정": "bg-emerald-500",
  "예약 가능": "bg-brand",
  "예약 중": "bg-sky-500",
  마감: "bg-slate-400",
};

function won(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

export default function CruiseDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { voyages, loading } = useVoyages();
  const { reservations } = useReservations();
  const [showActions, setShowActions] = useState(false); // 모바일: 상세보기 클릭 시 액션 버튼 2x2 펼침

  const index = voyages.findIndex((x) => x.id === id);
  const v = voyages[index];

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9]">
      <SiteHeader solid />

      <main className="flex-1">
        {loading ? (
          <div className="mx-auto w-full max-w-[68rem] px-5 pt-52 pb-32 max-[991px]:pt-16 max-[991px]:pb-16">
            <p className="py-20 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
          </div>
        ) : !v ? (
          <div className="mx-auto w-full max-w-[68rem] px-5 pt-52 pb-32 max-[991px]:pt-16 max-[991px]:pb-16">
            <div className="py-20 text-center">
              <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">일정을 찾을 수 없습니다.</p>
              <Link href="/cruises" className="mt-4 inline-block text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-brand hover:underline">
                ← 전체 일정으로
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* 요약 히어로 — #F5F7F9 */}
            <div className="bg-[#F5F7F9] pt-40 pb-8 max-[991px]:pt-16 max-[991px]:pb-3">
              <div className="w-full px-[max(10.7804%,calc((100%_-_1920px)/2_+_163px))] max-[991px]:px-0">
              <div className="flex gap-10 max-[991px]:flex-col max-[991px]:gap-5" style={{ fontSize: "var(--font-base)" }}>
                {/* ≤990px: 썸네일을 좌우 꽉 채우고 라운드·그림자 제거 */}
                <div className="relative aspect-square w-80 shrink-0 overflow-hidden rounded-2xl shadow-md max-[991px]:w-full max-[991px]:rounded-none max-[991px]:shadow-none">
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${regionGradient[v.region] ?? "from-sky-400 to-blue-700"}`} />
                  )}
                  <span className={`absolute left-4 top-4 rounded-md px-3 py-1 text-[min(1.0588vw,20.329px)] max-[991px]:text-[min(3.2977vw,19.7862px)] max-[501px]:text-[4.0048vw] font-semibold text-white ${statusBadge[v.status] ?? "bg-slate-500"}`}>
                    {v.status}
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col max-[991px]:px-[32px]">
                  {v.countries && v.countries.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {v.countries.map((c) => (
                        <span key={c} className="rounded-[5.77px] border border-[#C9A961] px-3 py-1 text-[min(1.0588vw,20.329px)] max-[991px]:text-[min(3.2977vw,19.7862px)] max-[501px]:text-[4.0048vw] font-medium text-[#C9A961]">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <h1 className="mt-4 min-h-[2.75em] whitespace-pre-line text-[min(1.9041vw,36.5587px)] font-semibold leading-snug text-black max-[991px]:text-[min(5.9308vw,35.5848px)] max-[501px]:text-[6.2414vw]">
                    {v.title}
                  </h1>

                  {/* eslint-disable @next/next/no-img-element */}
                  {v.itinerary && v.itinerary.length > 0 && (
                    <p className="mt-4 flex items-start gap-2 text-[min(1.2694vw,24.3725px)] max-[991px]:text-[min(3.9538vw,23.7228px)] max-[501px]:text-[4.8017vw] font-normal text-[#5A6B7E]">
                      <img src="/icons/detail/location.png" alt="" className="mt-1 h-4 w-4 shrink-0 object-contain" />
                      <span>
                        <span className="mr-2 font-semibold text-[#0B2A4A]">기항지</span>
                        {v.itinerary.join(" · ")}
                      </span>
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-2 text-[min(1.1104vw,21.3197px)] max-[991px]:text-[min(3.4586vw,20.7516px)] max-[501px]:text-[4.2003vw] font-normal text-[#5A6B7E]">
                    <span className="flex items-center gap-2">
                      <img src="/icons/detail/calendar.png" alt="" className="h-4 w-4 shrink-0 object-contain" />
                      {v.departDate} 출발 · {v.nights}박 {v.days}일
                    </span>
                    <span className="flex items-center gap-2">
                      <img src="/icons/detail/wallet.png" alt="" className="h-4 w-4 shrink-0 object-contain" />
                      성인 1인{" "}
                      {v.priceFrom > 0 ? (
                        <strong className="font-bold text-[#5A6B7E]">{won(v.priceFrom)}~</strong>
                      ) : (
                        <strong className="font-bold text-[#5A6B7E]">요금문의</strong>
                      )}
                    </span>
                  </div>
                  {/* eslint-enable @next/next/no-img-element */}

                  <div className="mb-6 mt-auto border-t-[1.44px] border-black/10" />

                  {(() => {
                    const reserved = reservations.filter((r) => r.voyageId === v.id).length;
                    const reserveBlocked = isPastVoyage(v) || reserved >= 30;
                    const blockLabel = isPastVoyage(v) ? "예약 마감 (출발일 경과)" : "예약 마감 (인원 마감)";
                    const actionBtns = (
                      <>
                        {reserveBlocked ? (
                          <span className="cursor-not-allowed rounded-none bg-slate-300 px-12 py-2 text-[min(0.8971vw,17.2243px)] max-[991px]:text-[min(2.794vw,16.764px)] max-[501px]:text-[3.3932vw] font-semibold text-white">{blockLabel}</span>
                        ) : (
                          <Link href={`/cruises/${v.id}/reserve`} className="rounded-none bg-navy px-12 py-2 text-[min(0.8971vw,17.2243px)] max-[991px]:text-[min(2.794vw,16.764px)] max-[501px]:text-[3.3932vw] font-semibold text-white transition hover:bg-navy-dark">가예약 신청</Link>
                        )}
                        <ConsultButton voyageTitle={v.title} className="rounded-none bg-[#2B548B] px-12 py-2 text-[min(0.8971vw,17.2243px)] max-[991px]:text-[min(2.794vw,16.764px)] max-[501px]:text-[3.3932vw] font-semibold text-white transition hover:brightness-110">상담문의</ConsultButton>
                        <PhoneConsult className="rounded-none bg-[#C9A961] px-12 py-2 text-[min(0.8971vw,17.2243px)] max-[991px]:text-[min(2.794vw,16.764px)] max-[501px]:text-[3.3932vw] font-semibold text-white transition hover:brightness-95" />
                        <ShareMenu
                          title={v.title}
                          description={`${v.region} · ${v.nights}박 ${v.days}일`}
                          imageUrl={v.thumbnail}
                          className="rounded-none border border-[#113667] px-12 py-2 text-[min(0.8971vw,17.2243px)] max-[991px]:text-[min(2.794vw,16.764px)] max-[501px]:text-[3.3932vw] font-semibold text-navy transition hover:border-brand hover:text-brand"
                        />
                      </>
                    );
                    return (
                      <>
                        {/* 데스크톱: 4버튼 인라인 */}
                        <div className="mb-3 flex flex-wrap gap-3 max-[991px]:hidden">{actionBtns}</div>
                        {/* 모바일: 상세보기 → 클릭 시 2x2 펼침 */}
                        <div className="mb-3 hidden max-[991px]:block">
                          {showActions ? (
                            <div className="grid grid-cols-2 gap-2 [&>*]:w-full [&>*]:!px-0 [&>*]:text-center">{actionBtns}</div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowActions(true)}
                              className="w-full rounded-none bg-[#113667] py-2 text-center text-[min(0.8277vw,15.8918px)] max-[991px]:text-[min(2.5782vw,15.4692px)] max-[501px]:text-[3.131vw] font-semibold text-white transition hover:brightness-110"
                            >
                              상세보기
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              </div>
            </div>

            {/* 탭 + 내용 — #fff */}
            <div className="bg-white pb-32 max-[991px]:pb-16">
              <div className="w-full px-[max(10.7143%,calc((100%_-_1920px)/2_+_162px))] max-[991px]:px-[6%]">
                <CruiseBooking voyage={v} index={index} />

                <Link href="/cruises" className="mt-10 inline-block text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-brand hover:underline">
                  ← 전체 일정으로 돌아가기
                </Link>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 하단 CTA */}
      <FinalCta
        lines={[
          { text: "이 일정으로", color: "navy" },
          { text: "떠날 준비가", color: "brand" },
          { text: "되셨다면", color: "brand" },
        ]}
        descLines={["전문 상담원이 가예약부터 출발까지", "안내해드립니다."]}
      />

      <SiteFooter />
    </div>
  );
}
