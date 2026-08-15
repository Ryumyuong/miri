import type { CSSProperties } from "react";
import type { ItineraryBlock, ItineraryBlockType } from "./types";

/** 일정 블록 공통 메타 — 에디터·상세 뷰가 함께 import 해서 한 곳만 바꾸면 둘 다 반영된다. */
export type BlockMeta = {
  label: string;
  icon: string;
  accent: string; // 헤더 라벨 색
  dot: string; // 타임라인 점 색
  headerBg: string; // 헤더 배경
  iconBg: string; // 헤더 아이콘 박스 배경 (색 9.4%)
};

export const BLOCK_META: Record<ItineraryBlockType, BlockMeta> = {
  air: { label: "항공", icon: "/itinerary-icons/air.png", accent: "text-[#2563EB]", dot: "bg-[#2563EB]", headerBg: "bg-[#2563EB08]", iconBg: "#2563EB18" },
  airDepart: { label: "출발 항공", icon: "/itinerary-icons/air.png", accent: "text-[#2563EB]", dot: "bg-[#2563EB]", headerBg: "bg-[#2563EB08]", iconBg: "#2563EB18" },
  airArrive: { label: "도착 항공", icon: "/itinerary-icons/air.png", accent: "text-[#2563EB]", dot: "bg-[#2563EB]", headerBg: "bg-[#2563EB08]", iconBg: "#2563EB18" },
  flight: { label: "항공", icon: "/itinerary-icons/air.png", accent: "text-[#2563EB]", dot: "bg-[#2563EB]", headerBg: "bg-[#2563EB08]", iconBg: "#2563EB18" },
  text: { label: "제목 텍스트", icon: "/itinerary-icons/text.png", accent: "text-[#1E3A5F]", dot: "bg-[#1E3A5F]", headerBg: "bg-[#1E3A5F08]", iconBg: "#1E3A5F18" },
  content: { label: "내용 텍스트", icon: "/itinerary-icons/text.png", accent: "text-[#1E3A5F]", dot: "bg-[#1E3A5F]", headerBg: "bg-[#1E3A5F08]", iconBg: "#1E3A5F18" },
  meal: { label: "식사", icon: "/itinerary-icons/meal.png", accent: "text-[#D97706]", dot: "bg-[#D97706]", headerBg: "bg-[#D9770608]", iconBg: "#D9770618" },
  image: { label: "이미지", icon: "/itinerary-icons/image.png", accent: "text-[#059669]", dot: "bg-[#059669]", headerBg: "bg-[#05966908]", iconBg: "#05966918" },
  ship: { label: "선박", icon: "/itinerary-icons/ship.png", accent: "text-[#0E7490]", dot: "bg-[#0E7490]", headerBg: "bg-[#0E749008]", iconBg: "#0E749018" },
  lodging: { label: "숙소", icon: "/itinerary-icons/lodging.png", accent: "text-[#7C3AED]", dot: "bg-[#7C3AED]", headerBg: "bg-[#7C3AED08]", iconBg: "#7C3AED18" },
  tour: { label: "관광정보", icon: "/icons/guide-grid/map.png", accent: "text-[#0891B2]", dot: "bg-[#0891B2]", headerBg: "bg-[#0891B208]", iconBg: "#0E749018" },
};

// 블록 추가 메뉴 순서 (식사는 메뉴에서 제외 — 각 일차 맨 아래 고정 배치. 항공은 경유 포함 단일 카드)
export const BLOCK_ORDER: ItineraryBlockType[] = ["flight", "text", "content", "image", "ship", "lodging", "tour"];

/** 일정표 본문 글자 크기 — PC(991↑)는 18px/16px 고정, 모바일(990↓)은 기존 em 비율대로 축소.
 *  `--itin-fs`는 블록별 크기 옵션(작게/보통/크게/아주 크게) 배율. 미지정이면 1. */
export const ITIN_TITLE_TEXT =
  "text-[length:calc(18px*var(--itin-fs,1))] max-[991px]:text-[length:calc(1.05em*var(--itin-fs,1))]";
export const ITIN_BODY_TEXT =
  "text-[length:calc(16px*var(--itin-fs,1))] max-[991px]:text-[length:calc(0.875em*var(--itin-fs,1))]";

/** 블록별 필드 정의 (라벨·배치). 에디터는 입력칸, 상세 뷰는 표시 박스로 렌더링한다. */
export type BlockField = {
  key: keyof ItineraryBlock;
  label: string;
  full?: boolean; // 2칸 차지
  area?: boolean; // textarea (에디터)
  date?: boolean; // 날짜 입력(type=date)
  time?: boolean; // 시간 입력(type=time, xx:xx)
  color?: boolean; // 색상 입력(type=color)
  rich?: boolean; // 리치텍스트(부분 굵게/크기/색상) — HTML 저장
  editorOnly?: boolean; // 에디터에만 입력칸으로, 상세 뷰에는 표시 안 함(스타일 제어용)
  below?: boolean; // 카드 아래 표시 (제목 텍스트의 설명)
  bold?: boolean; // 값 굵게 (상세 뷰)
  withIcon?: boolean; // 값 앞에 블록 아이콘 (상세 뷰)
  icon?: string; // 값 앞에 지정 아이콘 (withIcon 보다 우선)
  isImage?: boolean; // 이미지 업로드/표시
  options?: string[]; // 있으면 에디터에서 드롭다운(select)으로 렌더
  valueStyle?: CSSProperties; // 값 텍스트 인라인 스타일 오버라이드
  valueClass?: string; // 값 박스 글자 크기 클래스 (미지정 시 BLOCK_STYLE.valueSize)
  hideLabel?: boolean; // 상세 뷰에서 라벨 숨김
};

export const BLOCK_FIELDS: Record<ItineraryBlockType, BlockField[]> = {
  air: [
    { key: "airline", label: "항공사 / 편명", full: true, icon: "/itinerary-icons/f-plane.png", valueClass: ITIN_TITLE_TEXT },
    { key: "dateDepart", label: "출발일", date: true },
    { key: "time", label: "출발시간", time: true },
    { key: "dateArrive", label: "도착일", date: true },
    { key: "timeArrive", label: "도착시간", time: true },
    { key: "from", label: "출발지" },
    { key: "to", label: "도착지" },
    { key: "blockDesc", label: "설명", full: true, area: true, below: true },
  ],
  airDepart: [
    { key: "airline", label: "항공사 / 편명", icon: "/itinerary-icons/f-plane.png", valueClass: ITIN_TITLE_TEXT },
    { key: "from", label: "출발지" },
    { key: "dateDepart", label: "출발일", date: true },
    { key: "time", label: "출발시간", time: true },
    { key: "blockDesc", label: "설명", full: true, area: true, below: true },
  ],
  airArrive: [
    { key: "airline", label: "항공사 / 편명", icon: "/itinerary-icons/f-plane.png", valueClass: ITIN_TITLE_TEXT },
    { key: "to", label: "도착지" },
    { key: "dateArrive", label: "도착일", date: true },
    { key: "timeArrive", label: "도착시간", time: true },
    { key: "blockDesc", label: "설명", full: true, area: true, below: true },
  ],
  flight: [
    { key: "blockDesc", label: "설명", full: true, area: true, below: true },
  ],
  text: [
    { key: "title", label: "제목", full: true, bold: true, hideLabel: true, valueClass: ITIN_TITLE_TEXT },
    { key: "text", label: "설명", full: true, area: true, below: true },
  ],
  content: [{ key: "text", label: "내용", full: true, area: true, below: true }],
  meal: [
    { key: "meal", label: "식사 구분", icon: "/itinerary-icons/f-meal.png", options: ["조식", "브런치", "중식", "석식", "야식"], valueStyle: { color: "#BB4D00" } },
    { key: "place", label: "장소" },
    { key: "desc", label: "설명", full: true },
    { key: "blockDesc", label: "추가 설명", full: true, area: true, below: true },
  ],
  image: [
    { key: "caption", label: "캡션", full: true, valueClass: ITIN_TITLE_TEXT },
    { key: "url", label: "이미지", full: true, isImage: true },
    { key: "blockDesc", label: "설명", full: true, area: true, below: true },
  ],
  ship: [
    { key: "shipName", label: "선박명", full: true, bold: true, icon: "/itinerary-icons/f-shipname.png", valueClass: ITIN_TITLE_TEXT },
    { key: "boarding", label: "승선 정보" },
    { key: "departure", label: "출항 정보" },
    { key: "route", label: "항로", full: true, icon: "/itinerary-icons/f-route.png" },
    { key: "blockDesc", label: "설명", full: true, area: true, below: true },
  ],
  lodging: [
    { key: "lodgeName", label: "숙소명", full: true, bold: true, icon: "/itinerary-icons/f-lodge.png", valueClass: ITIN_TITLE_TEXT },
  ],
  tour: [
    { key: "tourImage", label: "이미지", full: true, isImage: true },
    { key: "tourName", label: "관광지", full: true, bold: true, valueClass: ITIN_TITLE_TEXT },
    { key: "tourCountry", label: "국가" },
    { key: "tourDesc", label: "설명", full: true },
    { key: "blockDesc", label: "추가 설명", full: true, area: true, below: true },
  ],
};

/** 자유 텍스트(부분 서식 가능) 필드 판별 — select/날짜/색상/이미지/에디터전용 제외 */
export function isRichField(f: BlockField): boolean {
  return !f.options && !f.isImage && !f.date && !f.time && !f.color && !f.editorOnly;
}

/** 공통 스타일 클래스 (에디터·뷰 동일) */
export const BLOCK_STYLE = {
  card: "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_0px_#0000001a]",
  headerPad: "px-[1.1em] py-[1.05em]",
  headerLabel: "text-[0.8571em] font-semibold",
  bodyGrid: "grid grid-cols-2 gap-x-[1.5em] gap-y-[1em] p-[1.2em] max-[501px]:grid-cols-1",
  fieldLabel: "mb-[0.4em] text-[0.8571em] font-medium text-[#99A1AF]",
  valueBox: "rounded-[10px] px-[1em] py-[0.75em] font-medium bg-[#F9FAFB] text-[#364153]",
  valueSize: ITIN_BODY_TEXT, // 값 박스 기본 = 내용 텍스트 16px (제목 성격 필드만 valueClass 로 18px)
  iconSize: "h-[1.8em] w-[1.8em]",
  inter: { fontFamily: "Inter, var(--font-sans)" } as React.CSSProperties,
  // 설명 좌측 세로 점선 (2px dashed #E5E7EB, dash 4,2)
  descRule: {
    backgroundImage:
      "repeating-linear-gradient(to bottom, #E5E7EB 0, #E5E7EB 4px, transparent 4px, transparent 6px)",
    backgroundSize: "2px 100%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "left top",
  } as CSSProperties,
};
