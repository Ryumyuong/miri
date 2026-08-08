import type { Voyage } from "./types";

/** 권역 필터 옵션 — /cruises 및 관리자 목록에서 공용 (세부 지중해 구분 포함) */
export const REGION_OPTS: { label: string; value: string | null }[] = [
  { label: "전체", value: null },
  { label: "서부지중해", value: "서부지중해" },
  { label: "동부지중해", value: "동부지중해" },
  { label: "북유럽", value: "북유럽" },
  { label: "미주·알래스카", value: "미주·알래스카" },
  { label: "중동", value: "중동" },
  { label: "동남아/동북아", value: "동남아/동북아" },
];

/** 지역 구분 필터 매칭 — 유럽 세부(서부/동부/북유럽)는 제목 키워드로, 나머지는 region으로 판정 */
export function matchesRegion(v: Voyage, region: string | null): boolean {
  if (!region) return true;
  if (v.region === region) return true; // 관리자에서 드롭다운으로 지정한 권역값 직접 매칭
  switch (region) {
    case "서부지중해":
      return /서부\s?지중해/.test(v.title);
    case "동부지중해":
      return v.title.includes("동부지중해");
    case "북유럽":
      return v.title.includes("북유럽");
    case "동남아/동북아":
      return v.region === "동남아" || v.region === "동북아";
    default:
      return false;
  }
}

/** 후기 카테고리 필터 매칭 — "동남아/동북아" 선택 시 옛 데이터(동남아/동북아)도 포함 */
export function matchesReviewCategory(reviewCategory: string, selected: string): boolean {
  if (selected === "동남아/동북아") {
    return reviewCategory === "동남아/동북아" || reviewCategory === "동남아" || reviewCategory === "동북아";
  }
  return reviewCategory === selected;
}
