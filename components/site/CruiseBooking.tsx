"use client";

import { Fragment, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Voyage, PortCard, DayPlan } from "@/lib/types";
import { usePorts } from "@/lib/usePorts";
import { relatedPortsFor } from "@/lib/ports";
import { useReservations } from "@/lib/useReservations";
import { useVoyages } from "@/lib/useVoyages";
import { useShips } from "@/lib/useShips";
import { siblingsOf, isPastVoyage, groupKey } from "@/lib/voyage-group";
import { DEFAULT_INCLUDED, DEFAULT_EXCLUDED } from "@/lib/voyage-defaults";
import { useReviews } from "@/lib/useReviews";
import ReservationForm from "@/components/site/ReservationForm";
import ReviewForm from "@/components/site/ReviewForm";
import ReviewGallery from "@/components/site/ReviewGallery";
import ConsultButton from "@/components/site/ConsultButton";
import ShareMenu from "@/components/site/ShareMenu";
import ItineraryView from "@/components/site/ItineraryView";
import SpecialTerms from "@/components/site/SpecialTerms";
import VideoGallery from "@/components/site/VideoGallery";
import PrintSheet from "@/components/site/PrintSheet";
import TravelPrep from "@/components/site/TravelPrep";

function won(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

/** 항공편 문자열에서 항공사 + 코드만 추출 (예: "에미레이트항공 EK323 (...)" → "에미레이트항공 (EK)").
 *  이미 "(QR)" 형태거나 편명이 없으면 원문 유지. */
function airlineShort(flight?: string): string {
  if (!flight) return "";
  const m = flight.match(/^(.*?)\s*([A-Z]{2})\d/);
  return m ? `${m[1].trim()} (${m[2]})` : flight;
}

function addDays(iso: string, n: number) {
  const d = new Date((iso || "") + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso || "";
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function monthLabel(iso: string) {
  return `${iso.slice(0, 4)}년 ${iso.slice(5, 7)}월`;
}

const TABS = [
  "상품선택",
  "주요여행일정",
  "요약정보",
  "상품정보",
  "미팅장소",
  "여행일정",
  "관광정보",
  "지도정보",
  "영상정보",
  "여행준비안내",
  "안전/유의사항",
  "약관/환불규정",
  "여행후기",
];

const SAFETY: { title: string; body: string }[] = [
  { title: "여권 유효기간 안내", body: "입국일 기준 6개월 이상 잔여 유효기간이 필요합니다. 출발 60일 전까지 사본 제출을 권장합니다." },
  { title: "크루즈 객실 금연 안내", body: "모든 객실 및 실내 공용 공간은 금연입니다. 흡연은 지정된 흡연 구역에서만 가능합니다." },
  { title: "임산부 탑승 규정", body: "임신 24주 이상인 경우 탑승이 제한될 수 있으며, 의사 소견서가 필요할 수 있습니다." },
  { title: "미성년자 동반 규정", body: "만 18세 미만은 보호자 동반 시에만 탑승 가능하며, 단독 탑승 시 동의서가 필요합니다." },
  { title: "건강상 이유에 따른 탑승 제한", body: "중대한 질환이나 거동이 불편하신 경우 예약 전 반드시 상담해 주시기 바랍니다." },
  { title: "항공 액체류 반입 제한", body: "기내 반입 액체류는 100ml 이하 용기만 가능하며, 총 1L 이내로 제한됩니다." },
  { title: "출발 당일 미팅 시간 준수", body: "미팅 시간에 늦을 경우 탑승이 불가할 수 있으니 반드시 시간을 준수해 주세요." },
  { title: "기상/재난/테러 등 일정 변경 가능성", body: "기상 악화나 불가항력적 사유로 기항지 및 세부 일정이 변경될 수 있습니다." },
  { title: "여행 중 안전수칙 준수", body: "선내 안전 교육 및 승무원의 안내에 따라 안전수칙을 준수해 주시기 바랍니다." },
];

const FLIGHTS = ["아시아나 OZ202", "대한항공 KE927", "싱가포르항공 SQ603", "에미레이트 EK322"];

const INCLUDED = DEFAULT_INCLUDED;
const EXCLUDED = DEFAULT_EXCLUDED;


const regionGradient: Record<string, string> = {
  "미주·알래스카": "from-cyan-300 to-sky-600",
  유럽: "from-sky-400 to-indigo-700",
  중동: "from-amber-400 to-orange-700",
  동남아: "from-emerald-300 to-teal-600",
  동북아: "from-blue-300 to-slate-600",
  "리버 크루즈": "from-amber-300 to-rose-500",
};

const statusBg: Record<string, string> = {
  "예약 가능": "bg-brand",
  "예약 중": "bg-sky-500",
  "출발 확정": "bg-emerald-500",
  마감: "bg-slate-400",
};

// 기항지 → 국가 (여행일정 탭 라벨용)
const PORT_COUNTRY: Record<string, string> = {
  시애틀: "미국", 주노: "미국", 스캐그웨이: "미국", 케치칸: "미국", 빅토리아: "캐나다",
  로마: "이탈리아", 제노아: "이탈리아", 마르세유: "프랑스", 바르셀로나: "스페인",
  칼리아리: "사르데냐", 나폴리: "이탈리아",
  싱가포르: "싱가포르", 페낭: "말레이시아", 푸켓: "태국", 랑카위: "말레이시아",
  부산: "대한민국", 후쿠오카: "일본", 나가사키: "일본",
  충칭: "중국", 펑두: "중국", 삼협댐: "중국", 의창: "중국",
  두바이: "아랍에미리트", 아부다비: "아랍에미리트", 도하: "카타르",
};

// 도시 → 공항 코드
const AIRPORT: Record<string, string> = {
  인천: "ICN", 부산: "PUS", 로마: "FCO", 시애틀: "SEA", 싱가포르: "SIN",
  후쿠오카: "FUK", 충칭: "CKG", 두바이: "DXB",
};

type DateOption = {
  voyage: Voyage;
  date: string;
  arrive: string;
  status: Voyage["status"];
  price: number;
  dday: number;
  flight: string;
};

export default function CruiseBooking({
  voyage: v,
  index,
}: {
  voyage: Voyage;
  index: number;
}) {
  const flight = v.flight || FLIGHTS[index % FLIGHTS.length];

  // 같은 크루즈(선박+권역+기간)의 실제 출발일들을 옵션으로
  const { voyages } = useVoyages();
  const siblings = siblingsOf(voyages, v).filter((s) => !isPastVoyage(s)); // 지난 출발일 제외
  const list = siblings.length ? siblings : [v];
  const allOptions: DateOption[] = list.map((s) => ({
    voyage: s,
    date: s.departDate,
    arrive: s.arriveDate,
    status: s.status,
    // 상품가(성인 1인 기준) = 내측 지정가 우선, 없으면 priceFrom (예약 페이지 내측과 일치)
    price: s.roomPrices?.["내측"] ?? s.priceFrom,
    dday: s.dDay ?? 0,
    flight: s.flight || flight,
  }));
  // 마감된 출발일은 상품선택에 노출하지 않음 (전부 마감이면 깨짐 방지로 전체 노출)
  const openOptions = allOptions.filter((o) => o.status !== "마감");
  const options = openOptions.length ? openOptions : allOptions;

  // 상품 이미지·설명·특징은 선박 카드에서 관리 (없으면 기존 항차 값으로 폴백)
  const { ships } = useShips();
  const ship = ships.find((s) => s.name === v.shipName);
  const productImages = (ship?.productImages?.length ? ship.productImages : v.productImages) ?? [];
  const productDesc = ship?.description || v.description;

  // 상세 콘텐츠: 운항 일정에 설정값이 있으면 사용, 없으면 기본값
  const included = v.included?.length ? v.included : INCLUDED; // 상품별 설정값 우선, 없으면 기본값
  const excluded = v.excluded?.length ? v.excluded : EXCLUDED;
  // 상품 특징: 선박 카드 → 항차 순으로 값이 있으면 사용, 둘 다 없으면 빈 배열(아무것도 표시 안 함)
  const features = ship?.features?.length ? ship.features : v.features?.length ? v.features : [];
  const safety = SAFETY; // 안전/유의사항은 고정
  const meetingPlace =
    v.meetingPlace || (v.title.includes("부산") ? "부산항 국제여객터미널" : "인천국제공항 제2터미널");
  const meetingInfo =
    v.meetingInfo ||
    "담당 인솔자가 미팅 장소에서 안내 피켓을 들고 대기합니다. 도착이 어려우신 경우 1644-8868로 연락 주시기 바랍니다.";

  // 관광정보 = 항구 카드 관리에서 등록한 카드 (기항지 우선, 없으면 권역/국가 매칭)
  const { ports } = usePorts();
  const relatedPorts: PortCard[] = relatedPortsFor(v, ports);

  // 출발일이 속한 월 목록 (실제 옵션 기준, 중복 제거)
  const months = Array.from(new Set(options.map((o) => o.date.slice(0, 7)).filter(Boolean))).sort();

  const productCode = `MC-${String(index + 1).padStart(5, "0")}`;

  const { reservations } = useReservations();

  // 검색에서 넘어오면 해당 인원, 직접 진입하면 1인으로 기본 세팅
  const searchParams = useSearchParams();
  const peopleParam = Number(searchParams.get("people"));
  const defaultAdult = Number.isFinite(peopleParam) && peopleParam > 0 ? peopleParam : 1;

  const [tab, setTab] = useState("상품선택");
  const [month, setMonth] = useState(v.departDate.slice(0, 7));
  const [selId, setSelId] = useState(v.id); // 선택된 출발일(형제 일정 id)
  const [adult, setAdult] = useState(defaultAdult);
  const [child, setChild] = useState(0);
  const [infant, setInfant] = useState(0);
  const [resvOpen, setResvOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false); // 상품 인쇄 미리보기
  const [lightbox, setLightbox] = useState<string | null>(null); // 지도 이미지 확대
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set()); // 후기 펼침
  const toggleReview = (id: string) =>
    setExpandedReviews((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // 이 운항 일정에 등록된 후기 (실제 작성 데이터)
  const { raw: allReviews } = useReviews();
  // 후기 연동 = 여행 일정 "묶음(그룹)" 기준
  //  후기의 voyageId가 가리키는 상품과 현재 상품이 같은 그룹(선박·권역·박/일 동일)이면 노출
  //  → 같은 상품의 다른 출발일 상세페이지에도 함께 노출됨
  const voyageReviews = allReviews.filter((r) => {
    if (!r.voyageId) return false;
    const rv = voyages.find((x) => x.id === r.voyageId);
    return rv ? groupKey(rv) === groupKey(v) : r.voyageId === v.id;
  });

  // 스크롤 위치에 따라 활성 탭 표시 (전체 내용 나열 + 탭은 해당 섹션으로 이동)
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) {
          const idx = Number((vis.target as HTMLElement).id.replace("sec-", ""));
          if (!Number.isNaN(idx) && TABS[idx]) setTab(TABS[idx]);
        }
      },
      { rootMargin: "-150px 0px -60% 0px", threshold: 0 },
    );
    TABS.forEach((_, i) => {
      const el = document.getElementById(`sec-${i}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // 탭바가 상단(64px)에 고정(stuck)되는 순간 감지 → 고정 시에만 위 패딩 추가
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [headerH, setHeaderH] = useState(64); // 실제 헤더 높이(폭에 따라 변함)에 탭바 top을 맞춤
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const update = () => setHeaderH(header.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  useEffect(() => {
    const el = tabBarRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setStuck(entry.intersectionRatio < 1),
      { threshold: [1], rootMargin: "-65px 0px 0px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const opt = options.find((o) => o.voyage.id === selId) ?? options[0];
  const monthOptions = options.filter((o) => o.date.slice(0, 7) === month);
  // 선택된 출발일의 실제 잔여 인원
  const remaining = Math.max(0, 30 - reservations.filter((r) => r.voyageId === opt.voyage.id).length);
  // 출발일 경과 또는 인원 마감이면 가예약 신청 차단
  const isPast = isPastVoyage(opt.voyage);
  const isFull = remaining <= 0;
  const reserveBlocked = isPast || isFull;
  const blockLabel = isPast ? "예약 마감 (출발일 경과)" : "예약 마감 (인원 마감)";
  const childPrice = Math.round(opt.price * 0.75);
  const total = adult * opt.price + child * childPrice;

  return (
    <div className="mt-12" style={{ fontSize: "var(--font-base)" }}>
      {/* 탭 네비 (sticky) — 클릭 시 왼쪽 내용만 전환 */}
      <div
        ref={tabBarRef}
        style={{ top: headerH }}
        className={`sticky z-30 -mx-5 mb-10 border-b-[2px] border-[#00000014] bg-white/95 px-5 backdrop-blur transition-[padding] max-[991px]:-mx-[6vw] max-[991px]:mb-4 max-[991px]:px-0 ${
          stuck ? "pt-4" : ""
        }`}
      >
        <nav className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t, i) => (
            <Fragment key={t}>
              {i > 0 && (
                <span aria-hidden className="h-[18px] w-px shrink-0 self-center bg-[#0000001a]" />
              )}
              <button
                onClick={() => {
                  setTab(t);
                  document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`flex-1 whitespace-nowrap border-b-2 py-2.5 text-center text-[min(0.77vw,14.784px)] transition max-[991px]:flex-none max-[991px]:shrink-0 max-[991px]:px-3 max-[991px]:text-[min(3.0835vw,18.501px)] max-[501px]:text-[3.7447vw] ${
                  tab === t
                    ? "border-brand font-bold text-brand"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            </Fragment>
          ))}
        </nav>
      </div>

      {/* 본문: 좌측(탭별 전환) + 우측 sticky 패널(유지) */}
      <div className="mt-32 grid grid-cols-[1fr_20rem] items-start gap-8 max-[991px]:mt-14 max-[991px]:grid-cols-1">
        {/* 좌측 — 탭에 따라 내용만 변경 */}
        <div className="min-w-0">
          <div id="sec-0" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-extrabold text-[#000000]">상품선택 / 출발일정</h2>
                <button
                  type="button"
                  onClick={() => setPrintOpen(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-[min(0.88vw,16.896px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
                >
                  🖨 인쇄
                </button>
              </div>
              <div className="rounded-[16px] border-t border-[#0B2A4A1a] bg-white p-6 max-[991px]:px-0">
                {/* 월 탭 */}
                <div className="flex gap-6 overflow-x-auto border-b border-slate-100 pb-3">
                  {months.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMonth(m)}
                      className={`whitespace-nowrap border-b-2 pb-2 text-[min(0.924vw,17.7408px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-medium transition ${
                        month === m
                          ? "border-gold text-[#0B2A4A]"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {monthLabel(m + "-01")}
                    </button>
                  ))}
                </div>

                {/* 출발일 옵션 */}
                <div className="mt-5 flex flex-wrap gap-3">
                  {monthOptions.length === 0 && (
                    <p className="py-6 text-[min(1.155vw,22.176px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">해당 월 출발 일정이 없습니다.</p>
                  )}
                  {monthOptions.map((o) => {
                    const on = selId === o.voyage.id;
                    return (
                      <button
                        key={o.voyage.id}
                        onClick={() => setSelId(o.voyage.id)}
                        className={`min-w-44 rounded-none border px-4 py-3 text-left transition ${
                          on
                            ? "border-[#1E4D8B] bg-[#1E4D8B0d]"
                            : "border-[#C9A961] hover:brightness-95"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className={`text-[min(1.056vw,20.2752px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-medium ${on ? "text-[#0B2A4A]" : "text-[#C9A961]"}`}>
                            {Number(o.date.slice(5, 7))}월 {Number(o.date.slice(8, 10))}일
                          </span>
                          <span className="rounded-full bg-[#F2F4F7] px-1.5 py-0.5 text-[min(0.792vw,15.2064px)] max-[991px]:text-[min(2.0556vw,12.3336px)] max-[501px]:text-[2.4964vw] font-medium text-[#0B2A4A]">
                            {o.status}
                          </span>
                        </div>
                        <p className="mt-1 text-[min(0.924vw,17.7408px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-medium text-[#5A6B7E]">{o.price > 0 ? `${won(o.price)}~` : "요금문의"}</p>
                      </button>
                    );
                  })}
                </div>

                {/* 상세 + 인원 */}
                <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 rounded-xl bg-slate-50 p-6 max-[501px]:grid-cols-1">
                  <dl className="col-span-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] [&_dd]:text-[#0B2A4A] [&_dt]:text-[#5A6B7E]">
                    <Row label="항공편" value={opt.flight} />
                  </dl>
                  <dl className="flex flex-col gap-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] [&_dd]:text-[#0B2A4A] [&_dt]:text-[#5A6B7E]">
                    <Row label="출발일" value={opt.date} />
                    <Row label="귀국일" value={opt.arrive} />
                    <Row label="잔여인원" value={`${remaining}명`} />
                  </dl>
                  <div className="flex flex-col gap-3">
                    <Counter label="성인" value={adult} set={setAdult} min={1} />
                    <Counter label="아동" value={child} set={setChild} min={0} />
                    <Counter label="유아" value={infant} set={setInfant} min={0} />
                  </div>
                  <div className="col-span-2 flex items-center justify-between border-t border-slate-200 pt-4 max-[501px]:col-span-1">
                    <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">합계</span>
                    <span className="text-[min(0.99vw,19.008px)] max-[991px]:text-[min(3.0835vw,18.501px)] max-[501px]:text-[3.7447vw] font-normal text-[#0B2A4A]">{opt.price > 0 ? won(total) : "요금문의"}</span>
                  </div>
                </div>

                {/* 가예약 신청 → 위저드 페이지로 이동 (마감 시 비활성화) */}
                {reserveBlocked ? (
                  <button
                    type="button"
                    disabled
                    className="mt-5 block w-full cursor-not-allowed rounded-none bg-slate-300 py-4 text-center text-[min(1.056vw,20.2752px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-semibold text-white"
                  >
                    {blockLabel}
                  </button>
                ) : (
                  <Link
                    href={`/cruises/${opt.voyage.id}/reserve?adult=${adult}&child=${child}`}
                    className="mt-5 block w-full rounded-none bg-[#1E4D8B] py-4 text-center text-[min(1.056vw,20.2752px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-semibold text-white transition hover:brightness-110"
                  >
                    가예약 신청
                  </Link>
                )}
                <p className="mt-3 text-center text-[min(0.66vw,12.672px)] max-[991px]:text-[min(2.0556vw,12.3336px)] max-[501px]:text-[2.4964vw] text-[#5A6B7E]">
                  * 가예약 후 출발 확정 안내 시점에 계약금이 발생합니다.
                </p>
              </div>
            </section>
          </div>

          <div id="sec-1" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">주요 여행일정</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <dl className="divide-y divide-slate-100">
                  <InfoRow icon="/icons/summary/calendar.png" label="여행기간" value={`${v.nights}박 ${v.days}일`} />
                  <InfoRow icon="/icons/summary/meeting-pin.png" label="미팅안내" value={meetingPlace} />
                  <InfoRow icon="/icons/summary/flight-out.png" label="항공편" value={airlineShort(opt.flight)} />
                  <InfoRow icon="/icons/summary/calendar.png" label="출국일" value={opt.date} />
                  <InfoRow icon="/icons/summary/calendar.png" label="귀국일" value={opt.arrive} />
                  <InfoRow icon="/icons/summary/ship.png" label="선박" value={`${v.shipName} (${v.line})`} />
                  <InfoRow icon="/icons/summary/guide.png" label="인솔자" value={v.guide || "전 일정 전문 인솔자 동행"} />
                  <InfoRow icon="/icons/summary/insurance.png" label="여행자보험" value={v.insurance || "포함 (질병/상해 보장)"} />
                </dl>
              </div>
            </section>
          </div>

          <div id="sec-2" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">포함 · 불포함 요약</h2>
              <div className="grid grid-cols-2 gap-5 max-[501px]:grid-cols-1">
                <SummaryCard
                  title="포함 사항"
                  mark="✓"
                  markClass="text-emerald-500"
                  items={included}
                />
                <SummaryCard
                  title="불포함 사항"
                  mark="✕"
                  markClass="text-red-500"
                  items={excluded}
                />
              </div>
            </section>
          </div>

          <div id="sec-3" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">상품정보</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {/* 대표 이미지 */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {v.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.thumbnail} alt={v.title} className="h-full w-full object-cover" />
                  ) : (
                    <div
                      className={`h-full w-full bg-gradient-to-br ${
                        regionGradient[v.region] ?? "from-sky-400 to-blue-700"
                      }`}
                    />
                  )}
                </div>

                <div className="p-6">
                  <p className="whitespace-pre-line text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-600">
                    {productDesc ||
                      `${v.line}의 대표 선박 ${v.shipName}와 함께하는 ${v.nights}박 ${v.days}일 일정. ${v.itinerary?.length ?? 0}개 기항지에서 도시의 매력을 만끽하시고, 선상에서는 식사·엔터테인먼트·휴식을 자유롭게 즐기실 수 있습니다.`}
                  </p>

                  {features.length > 0 && (
                    <div className="mt-5 grid grid-cols-3 gap-3 max-[991px]:grid-cols-2 max-[501px]:grid-cols-1">
                      {features.map((f) => (
                        <span
                          key={f}
                          className={`flex items-start gap-2 rounded-lg bg-slate-50 px-4 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-snug text-slate-600 ${
                            f.length > 24 ? "col-span-full" : ""
                          }`}
                        >
                          <span className="shrink-0 text-gold">✓</span>
                          <span className="min-w-0 break-keep">{f}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 상품 이미지 갤러리 (선박 카드) */}
                  {productImages.length > 0 && (
                    <div className="mt-6 grid grid-cols-3 gap-3 max-[991px]:grid-cols-2 max-[501px]:grid-cols-1">
                      {productImages.map((url, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={url} alt={`상품 이미지 ${i + 1}`} className="aspect-video w-full rounded-lg object-cover" />
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </section>
          </div>

          <div id="sec-4" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">미팅장소</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/summary/meeting.png" alt="" className="h-11 w-11 shrink-0 object-contain" />
                  <div>
                    <p className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">{meetingPlace}</p>
                    <p className="mt-0.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">
                      {v.meetingTime
                        ? `미팅 시간: ${v.meetingTime}`
                        : "미팅 장소 및 시간은 추후 인솔자가 '개별안내' 드립니다."}
                    </p>
                  </div>
                </div>

                <p className="mt-5 whitespace-pre-line rounded-lg bg-slate-50 px-5 py-4 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-500">
                  {meetingInfo}
                </p>

                {v.meetingMapImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.meetingMapImage}
                    alt="미팅장소 지도"
                    onClick={() => setLightbox(v.meetingMapImage!)}
                    className="mt-4 mx-auto block h-auto max-w-full cursor-pointer rounded-lg border border-slate-200"
                  />
                )}
                <button
                  onClick={() =>
                    v.meetingMapUrl
                      ? window.open(v.meetingMapUrl, "_blank")
                      : v.meetingMapImage
                        ? setLightbox(v.meetingMapImage)
                        : window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPlace)}`, "_blank")
                  }
                  className="mt-4 w-full rounded-lg border border-navy/30 py-3.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-navy transition hover:border-brand hover:text-brand"
                >
                  미팅장소 지도 {v.meetingMapImage && !v.meetingMapUrl ? "크게 보기" : "보기"}
                </button>
              </div>
            </section>
          </div>

          <div id="sec-5" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">여행일정</h2>
              <div className="min-[991px]:text-[1.18em]">
                {v.itineraryDays && v.itineraryDays.length > 0 ? (
                  v.itineraryStatus === "draft" ? (
                    // 임시저장(초안) 일정은 노출하지 않음 — 최종 발행 후 공개
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.693vw,13.3056px)] max-[991px]:text-[min(2.1585vw,12.951px)] max-[501px]:text-[2.6213vw] text-slate-400">
                      상세 일정을 준비 중입니다. 최종 확정 후 공개됩니다.
                    </div>
                  ) : (
                    <ItineraryView days={v.itineraryDays} departDate={opt.date} />
                  )
                ) : (
                  <ItineraryDays voyage={v} flight={opt.flight} departDate={opt.date} />
                )}
              </div>
            </section>
          </div>

          <div id="sec-6" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">관광정보</h2>
              {relatedPorts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
                  등록된 관광정보가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-5 max-[991px]:grid-cols-2 max-[501px]:grid-cols-1">
                  {relatedPorts.map((p) => (
                    <article
                      key={p.id}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                    >
                      <div className="h-32 w-full overflow-hidden">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div
                            className={`h-full w-full bg-gradient-to-br ${
                              regionGradient[p.region] ?? "from-sky-400 to-blue-700"
                            }`}
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-gold">{p.country}</p>
                        <p className="mt-1 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">{p.name}</p>
                        <p className="mt-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-500">{p.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div id="sec-7" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">지도정보 / 항로</h2>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                {v.routeMapImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.routeMapImage}
                      alt="항로 지도"
                      onClick={() => setLightbox(v.routeMapImage!)}
                      className="mx-auto block h-auto max-w-full cursor-pointer rounded-lg"
                    />
                    <button
                      onClick={() => setLightbox(v.routeMapImage!)}
                      className="mt-4 w-full rounded-lg border border-slate-300 py-3.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-navy transition hover:border-brand hover:text-brand"
                    >
                      🗺 지도 크게 보기
                    </button>
                  </>
                ) : (
                  <div className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">등록된 지도정보가 없습니다.</div>
                )}
              </div>
            </section>
          </div>

          <div id="sec-8" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <VideoGallery videos={v.videos} />
            </section>
          </div>

          {/* 여행준비 안내 (영상 ↔ 안전/유의사항 사이) */}
          <div id="sec-9" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <TravelPrep />
            </section>
          </div>

          <div id="sec-10" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">안전 / 유의사항</h2>
              <SafetyAccordion items={safety} />
            </section>
          </div>

          <div id="sec-11" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">약관 / 환불 규정</h2>

              {/* 취소료 규정 (여행개시일 기준 자동 계산) */}
              <CancellationFeeTable departDate={opt.date} />
            </section>
          </div>

          <div id="sec-12" className="scroll-mt-[150px] [&:not(:first-child)]:mt-14">
            <section>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">여행후기</h2>
                <button
                  onClick={() => setReviewOpen(true)}
                  className="rounded-lg bg-navy px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark"
                >
                  후기 작성하기
                </button>
              </div>
              {voyageReviews.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
                  <p className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] text-gold">★★★</p>
                  <p className="mt-4 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">아직 등록된 여행후기가 없습니다.</p>
                  <p className="mt-1.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">첫 후기를 남겨주신 분께 감사의 마음을 전합니다.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {voyageReviews.map((r) => {
                    const imgs = r.images?.length ? r.images : r.imageUrl ? [r.imageUrl] : [];
                    const expanded = expandedReviews.has(r.id);
                    return (
                    <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-navy">{r.title}</p>
                        <p className="text-gold">{"★".repeat(r.rating)}<span className="text-slate-200">{"★".repeat(5 - r.rating)}</span></p>
                      </div>

                      {expanded ? (
                        <>
                          <p className="mt-2 whitespace-pre-line text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-600">{r.content}</p>
                          {imgs.length > 0 && (
                            <div className="mt-3">
                              <ReviewGallery images={imgs} alt={r.title} />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="mt-2 flex gap-4">
                          <p className="line-clamp-3 min-w-0 flex-1 whitespace-pre-line text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-600">{r.content}</p>
                          {imgs.length > 0 && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imgs[0]} alt="" className="h-[6em] w-[8em] shrink-0 rounded-lg object-cover max-[501px]:h-[5em] max-[501px]:w-[6em]" />
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{r.author} · {r.date}</p>
                        <button
                          type="button"
                          onClick={() => toggleReview(r.id)}
                          className="shrink-0 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-[#1E4D8B] hover:underline"
                        >
                          {expanded ? "접기 ▲" : "펼치기 ▼"}
                        </button>
                      </div>
                    </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* 우측 요약 패널 — 탭과 무관하게 항상 유지 */}
        <aside className="sticky top-[280px] self-start max-[991px]:hidden">
          <div className="rounded-2xl border border-[#0B2A4A66] bg-white p-6 shadow-[0px_4px_6px_-4px_#094B9F1a]" style={{ fontSize: "var(--font-base)" }}>
            <p className="text-[min(0.792vw,15.2064px)] max-[991px]:text-[min(2.0556vw,12.3336px)] max-[501px]:text-[2.4964vw] font-semibold text-gold">선택중인 일정</p>
            <h3 className="mt-2 whitespace-pre-line text-[min(1.188vw,22.8096px)] max-[991px]:text-[min(3.0835vw,18.501px)] max-[501px]:text-[3.7447vw] font-bold leading-snug text-navy">{v.title}</h3>

            <dl className="mt-5 flex flex-col gap-2.5 text-[min(0.924vw,17.7408px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw]">
              <Row label="출발일" value={opt.date} />
              <Row label="D-Day" value={`D-${opt.dday}`} />
              <Row label="상품코드" value={productCode} />
            </dl>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[min(0.792vw,15.2064px)] max-[991px]:text-[min(2.0556vw,12.3336px)] max-[501px]:text-[2.4964vw] text-slate-400">상품가 (성인 1인 기준)</p>
              <p className="mt-1 text-[min(1.584vw,30.4128px)] max-[991px]:text-[min(4.1114vw,24.6684px)] max-[501px]:text-[4.9931vw] font-semibold text-[#0B2A4A]">
                {opt.price > 0 ? `${won(opt.price)}~` : "요금문의"}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              {reserveBlocked ? (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-none bg-slate-300 py-3 text-center text-[min(1.056vw,20.2752px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-bold text-white"
                >
                  {blockLabel}
                </button>
              ) : (
                <Link
                  href={`/cruises/${opt.voyage.id}/reserve?adult=${adult}&child=${child}`}
                  className="rounded-none bg-[#1E4D8B] py-3 text-center text-[min(1.056vw,20.2752px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-bold text-white transition hover:brightness-110"
                >
                  가예약 신청
                </Link>
              )}
              <ConsultButton
                voyageTitle={v.title}
                className="rounded-none bg-[#1E4D8B] py-3 text-center text-[min(0.88vw,16.896px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-bold text-white transition hover:brightness-110"
              >
                상담 문의
              </ConsultButton>
              <ShareMenu
                title={v.title}
                description={`${v.region} · ${v.nights}박 ${v.days}일`}
                imageUrl={v.thumbnail}
                className="w-full rounded-none border border-[#0B2A4A1a] py-3 text-[min(1.056vw,20.2752px)] max-[991px]:text-[min(2.741vw,16.446px)] max-[501px]:text-[3.3288vw] font-semibold text-[#0B2A4A] transition hover:border-brand hover:text-brand"
              />
            </div>

            <dl className="mt-5 flex flex-col gap-2.5 border-t border-slate-100 pt-4 text-[min(1.155vw,22.176px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
              <Row label="담당" value="미리크루즈" strong />
              <Row label="전화" value="1644-8868" strong />
            </dl>
          </div>
        </aside>
      </div>

      {resvOpen && (
        <ReservationForm
          voyage={opt.voyage}
          departDate={opt.date}
          arriveDate={opt.arrive}
          headcount={adult + child + infant}
          onClose={() => setResvOpen(false)}
        />
      )}

      {printOpen && (
        <PrintSheet
          voyage={opt.voyage}
          opt={{ date: opt.date, arrive: opt.arrive, price: opt.price, flight: opt.flight }}
          included={included}
          excluded={excluded}
          features={features}
          meetingPlace={meetingPlace}
          productDesc={productDesc}
          onClose={() => setPrintOpen(false)}
        />
      )}
      {reviewOpen && <ReviewForm voyage={v} onClose={() => setReviewOpen(false)} />}

      {/* 지도 이미지 라이트박스 */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 text-[min(1.925vw,36.96px)] max-[991px]:text-[min(5.9957vw,35.9742px)] max-[501px]:text-[7.2815vw] leading-none text-white/80 hover:text-white"
            aria-label="닫기"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="지도"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="w-[4.2em] shrink-0 whitespace-nowrap text-slate-400">{label}</dt>
      <dd className={`whitespace-nowrap ${strong ? "font-bold text-navy" : "font-medium text-slate-700"}`}>
        {value}
      </dd>
    </div>
  );
}

type DayItem = {
  day: number;
  title: React.ReactNode;
  tag: string;
  kind: "flight-out" | "embark" | "port" | "flight-in" | "arrive";
};

// 일자별 상세 여행일정 — 관리자/스크립트로 등록한 dayPlans 를 그대로 노출
function DayPlanList({ plans }: { plans: DayPlan[] }) {
  // 식사: 조식/중식/석식 배지 + 내용 (미포함도 표시)
  const meal = (label: string, value?: string) => (
    <span className="flex items-center gap-1.5">
      <span className="rounded bg-navy/5 px-2 py-0.5 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-bold text-navy">{label}</span>
      <span className={value ? "text-slate-600" : "text-slate-300"}>{value || "미포함"}</span>
    </span>
  );
  return (
    <div className="flex flex-col gap-4">
      {plans.map((d) => (
        <div key={d.day} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 bg-slate-50 px-5 py-3.5">
            <span className="shrink-0 rounded-full bg-navy px-2.5 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-bold text-white">
              DAY {d.day}
            </span>
            <span className="font-bold text-navy">{d.day}일차</span>
            <span className="text-slate-300">|</span>
            <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600">
              {d.date}
              {d.weekday ? ` ${d.weekday}` : ""}
            </span>
            {d.title && <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-brand">· {d.title}</span>}
          </div>

          <div className="px-5 py-4">
            <ul className="flex flex-col gap-1.5">
              {d.body.map((line, i) => (
                <li key={i} className="flex gap-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-600">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            {(d.hotel || d.meals) && (
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
                {d.hotel && (
                  <div className="flex gap-2">
                    <span className="shrink-0 font-semibold text-slate-500">🏨 숙박</span>
                    <span className="text-slate-600">{d.hotel}</span>
                  </div>
                )}
                {d.meals && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {meal("조식", d.meals.breakfast)}
                    {meal("중식", d.meals.lunch)}
                    {meal("석식", d.meals.dinner)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItineraryDays({
  voyage: v,
  flight,
  departDate,
}: {
  voyage: Voyage;
  flight: string;
  departDate: string;
}) {
  // 일자별 상세 여행일정(dayPlans)이 있으면 우선 표시
  if (v.dayPlans && v.dayPlans.length > 0) {
    return <DayPlanList plans={v.dayPlans} />;
  }
  // 일자별 상세 일정 데이터가 있으면 표(일자/지역/도착/출발)로 표시
  if (v.schedule && v.schedule.length > 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="px-5 py-3 text-left font-semibold">일자</th>
              <th className="px-5 py-3 text-left font-semibold">지역</th>
              <th className="px-5 py-3 text-center font-semibold">도착</th>
              <th className="px-5 py-3 text-center font-semibold">출발</th>
            </tr>
          </thead>
          <tbody>
            {v.schedule.map((r, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 font-semibold text-navy">{r.date}</td>
                <td className="px-5 py-3 text-slate-700">{r.place}</td>
                <td className="px-5 py-3 text-center text-slate-500">{r.arrive || "-"}</td>
                <td className="px-5 py-3 text-center text-slate-500">{r.depart || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const itin = v.itinerary ?? [];
  const departCity = v.title.includes("부산") ? "부산" : "인천";
  const first = itin[0];
  const last = itin[itin.length - 1];

  const portCountry = (p: string) =>
    PORT_COUNTRY[p] ? `${p} (${PORT_COUNTRY[p]})` : p;

  const days: DayItem[] = [];
  let n = 1;
  days.push({
    day: n++,
    title: (
      <>
        {departCity} <span className="text-slate-400">→</span> {first}
      </>
    ),
    tag: "항공",
    kind: "flight-out",
  });
  days.push({ day: n++, title: portCountry(first), tag: "크루즈 · 19:00 출발", kind: "embark" });
  for (let i = 1; i < itin.length; i++) {
    days.push({
      day: n++,
      title: portCountry(itin[i]),
      tag: "도착 08:00 · 출발 17:00",
      kind: "port",
    });
  }
  days.push({
    day: n++,
    title: (
      <>
        {last} <span className="text-slate-400">→</span> {departCity}
      </>
    ),
    tag: "도착 07:00",
    kind: "flight-in",
  });
  days.push({ day: n++, title: `${departCity} 도착`, tag: "항공", kind: "arrive" });

  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {days.map((d, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <span className="shrink-0 rounded-full bg-navy px-2.5 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-bold text-white">
              DAY {d.day}
            </span>
            <span className="font-bold text-navy">{d.day}일차</span>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-700">{d.title}</span>
            <span className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{d.tag}</span>
            <span className="ml-auto text-slate-400">{open === i ? "▲" : "▼"}</span>
          </button>

          {open === i && (
            <div className="border-t border-slate-100 px-5 py-6">
              {d.kind === "flight-out" ? (
                <FlightTimeline
                  from={{ code: AIRPORT[departCity] ?? "", city: departCity, date: departDate, time: "15:00" }}
                  to={{ code: AIRPORT[first] ?? "", city: first, date: addDays(departDate, 1), time: "07:00" }}
                  flight={flight}
                />
              ) : d.kind === "flight-in" ? (
                <FlightTimeline
                  from={{ code: AIRPORT[last] ?? "", city: last, date: addDays(v.arriveDate, -1), time: "21:00" }}
                  to={{ code: AIRPORT[departCity] ?? "", city: departCity, date: v.arriveDate, time: "07:00" }}
                  flight={flight}
                />
              ) : (
                <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-500">
                  {d.kind === "embark"
                    ? "크루즈에 승선하여 저녁 출항합니다. 선상에서 첫 밤을 보내세요."
                    : d.kind === "arrive"
                      ? `${departCity}국제공항 도착 후 해산합니다. 즐거운 여행 되세요.`
                      : "기항지에서 자유 또는 선택 관광을 즐기실 수 있습니다."}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function FlightTimeline({
  from,
  to,
  flight,
}: {
  from: { code: string; city: string; date: string; time: string };
  to: { code: string; city: string; date: string; time: string };
  flight: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
        <span className="flex-1 border-t border-dotted border-slate-300" />
        <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-navy">✈ {flight}</span>
        <span className="flex-1 border-t border-dotted border-slate-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand" />
      </div>
      <div className="mt-3 flex items-start justify-between text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw]">
        <div>
          <p className="text-[0.85em] font-semibold text-[#1E4D8B]">출발시간</p>
          <p className="mt-1 font-bold text-navy">
            {from.code} {from.city}
          </p>
          <p className="mt-1 text-slate-400">{from.date}</p>
          <p className="text-slate-400">{from.time}</p>
        </div>
        <div className="text-center">
          <p className="text-[0.85em] font-semibold text-[#1E4D8B]">경유대기시간</p>
          <p className="mt-1 text-slate-400">20시간 30분 · 직항</p>
        </div>
        <div className="text-right">
          <p className="text-[0.85em] font-semibold text-[#1E4D8B]">도착시간</p>
          <p className="mt-1 font-bold text-navy">
            {to.code} {to.city}
          </p>
          <p className="mt-1 text-slate-400">{to.date}</p>
          <p className="text-slate-400">{to.time}</p>
        </div>
      </div>
    </div>
  );
}

function SafetyAccordion({ items }: { items: { title: string; body: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="flex flex-col gap-3">
      {items.map((s, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button
            onClick={() => setOpen(open === i ? -1 : i)}
            className="flex w-full items-center gap-3 px-5 py-4 text-left"
          >
            <span className="text-brand">ⓘ</span>
            <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-navy">{s.title}</span>
            <span className="ml-auto text-slate-400">{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && (
            <p className="border-t border-slate-100 px-5 py-4 text-[min(0.8085vw,15.5232px)] max-[991px]:text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.0582vw] leading-relaxed text-slate-500">
              {s.body}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function RouteMap({ itinerary }: { itinerary: string[] }) {
  const n = itinerary.length;
  if (n === 0) return null;

  const points = itinerary.map((label, i) => {
    const t = n === 1 ? 0 : i / (n - 1);
    const x = 8 + t * 84;
    const y = 82 - t * 56 + Math.sin(i * 1.1) * 3;
    return { x, y, label, type: i === 0 ? "start" : i === n - 1 ? "end" : "mid" };
  });

  const d = points.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="relative h-[22rem] w-full overflow-hidden rounded-xl bg-gradient-to-b from-slate-50 to-sky-50">
      {/* 점선 항로 */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={d}
          fill="none"
          stroke="#113667"
          strokeWidth={1.5}
          strokeDasharray="3 4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* 기항지 핀 */}
      {points.map((p, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {/* 마커 (점 위) */}
          <div className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2">
            {p.type === "start" ? (
              <ShipIcon />
            ) : p.type === "end" ? (
              <ShipIcon flag />
            ) : (
              <AnchorPin />
            )}
          </div>
          {/* 점 */}
          <div className="h-2.5 w-2.5 rounded-full bg-navy ring-2 ring-white" />
          {/* 라벨 (점 아래) */}
          <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-navy/30 bg-white px-2.5 py-0.5 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-semibold text-navy">
            {p.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnchorPin() {
  return (
    <svg width="26" height="32" viewBox="0 0 26 32" fill="none">
      <path
        d="M13 0a13 13 0 0 0-13 13c0 8.5 13 19 13 19s13-10.5 13-19A13 13 0 0 0 13 0Z"
        fill="#113667"
      />
      <g stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none">
        <circle cx="13" cy="8" r="1.5" />
        <path d="M13 9.5v8M9.4 13.5a3.6 3.6 0 0 0 7.2 0M9.4 13.5H8m9 0h1.4" />
      </g>
    </svg>
  );
}

function ShipIcon({ flag }: { flag?: boolean }) {
  return (
    <svg width="34" height="30" viewBox="0 0 34 30" fill="#113667">
      {flag && <path d="M17 8V2h5l-1.4 2L22 6h-5Z" />}
      <rect x="10" y="8" width="13" height="7" rx="1" />
      <path d="M3 15h28l-2.4 6a2 2 0 0 1-1.8 1.2H7.2a2 2 0 0 1-1.8-1.2L3 15Z" />
      <path
        d="M1 25c2 0 2 1.3 4 1.3S9 25 11 25s2 1.3 4 1.3S19 25 21 25s2 1.3 4 1.3 2-1.3 4-1.3"
        stroke="#113667"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CancellationFeeTable({ departDate }: { departDate: string }) {
  return <SpecialTerms departDate={departDate} />;
}

function SummaryCard({
  title,
  mark,
  markClass,
  items,
}: {
  title: string;
  mark: string;
  markClass: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="mb-4 flex items-center gap-2 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">
        <span className={markClass}>{mark}</span>
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-600">
            <span className={`${markClass} text-[1.0714em]`}>{mark}</span>
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-4">
      <span className="flex w-24 shrink-0 items-center gap-2 text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E] max-[501px]:w-20 max-[501px]:gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" className="h-[1.4em] w-[1.4em] shrink-0 object-contain" />
        {label}
      </span>
      <span className="text-[min(0.9477vw,18.1958px)] max-[991px]:text-[min(2.9518vw,17.7108px)] max-[501px]:text-[2.97vw] font-semibold text-[#0B2A4A]">{value}</span>
    </div>
  );
}

function Counter({
  label,
  value,
  set,
  min,
}: {
  label: string;
  value: number;
  set: (n: number) => void;
  min: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => set(Math.max(min, value - 1))}
          className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand hover:text-brand max-[991px]:h-5 max-[991px]:w-5"
        >
          −
        </button>
        <span className="w-5 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-[#0B2A4A]">{value}</span>
        <button
          onClick={() => set(value + 1)}
          className="grid h-7 w-7 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand hover:text-brand max-[991px]:h-5 max-[991px]:w-5"
        >
          +
        </button>
      </div>
    </div>
  );
}
