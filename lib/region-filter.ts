import type { Voyage } from "./types";

/** 유럽 상위 묶음 — 서부지중해·동부지중해·북유럽을 모두 포함 */
export const EUROPE_SUB_REGIONS = ["서부지중해", "동부지중해", "북유럽"];

/** 아시아 묶음 — 동남아·동북아는 어느 쪽을 선택해도 서로 함께 노출된다 */
export const ASIA_REGIONS = ["동남아/동북아", "동남아", "동북아"];

/** 권역 값 목록 — 운항 일정에 저장되는 실제 권역(관리자 등록 드롭다운용). 상위 묶음("유럽")은 포함하지 않는다. */
export const REGION_OPTS: { label: string; value: string | null }[] = [
  { label: "전체", value: null },
  { label: "서부지중해", value: "서부지중해" },
  { label: "동부지중해", value: "동부지중해" },
  { label: "북유럽", value: "북유럽" },
  { label: "미주·알래스카", value: "미주·알래스카" },
  { label: "중동", value: "중동" },
  { label: "동남아/동북아", value: "동남아/동북아" },
];

/** 권역 필터 옵션 — 목록 화면(/cruises, 관리자 목록)용. "유럽"은 세부 3개를 묶어 보여주는 상위 칩. */
export const FILTER_REGION_OPTS: { label: string; value: string | null }[] = [
  { label: "전체", value: null },
  { label: "유럽", value: "유럽" },
  ...REGION_OPTS.filter((o) => o.value),
];

/** URL(?region=…) 등으로 들어온 값을 필터 칩 값으로 정규화 — 동남아·동북아 → "동남아/동북아" */
export function normalizeFilterRegion(region: string | null): string | null {
  if (!region) return null;
  if (ASIA_REGIONS.includes(region)) return "동남아/동북아";
  return region;
}

/** 지역 구분 필터 매칭 — 유럽 세부(서부/동부/북유럽)는 제목 키워드로, 나머지는 region으로 판정 */
export function matchesRegion(v: Voyage, region: string | null): boolean {
  if (!region) return true;
  if (v.region === region) return true; // 관리자에서 드롭다운으로 지정한 권역값 직접 매칭
  switch (region) {
    case "유럽":
      // 상위 묶음: 서부지중해 · 동부지중해 · 북유럽 중 하나라도 맞으면 포함
      return EUROPE_SUB_REGIONS.some((sub) => matchesRegion(v, sub));
    case "서부지중해":
      return /서부\s?지중해/.test(v.title);
    case "동부지중해":
      return v.title.includes("동부지중해");
    case "북유럽":
      return v.title.includes("북유럽");
    case "동남아/동북아":
    case "동남아":
    case "동북아":
      // 동남아·동북아는 하나만 골라도 둘 다 노출
      return ASIA_REGIONS.includes(v.region);
    default:
      return false;
  }
}

/** 후기 카테고리 필터 매칭
 *  - "유럽" 선택 시 서부지중해·동부지중해·북유럽 후기를 모두 포함
 *  - "동남아/동북아 · 동남아 · 동북아"는 어느 쪽을 골라도 서로 함께 노출 */
export function matchesReviewCategory(reviewCategory: string, selected: string): boolean {
  if (selected === "유럽") {
    return reviewCategory === "유럽" || EUROPE_SUB_REGIONS.includes(reviewCategory);
  }
  if (ASIA_REGIONS.includes(selected)) {
    return ASIA_REGIONS.includes(reviewCategory);
  }
  return reviewCategory === selected;
}
