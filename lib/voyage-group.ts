import type { Voyage } from "./types";

/** 오늘 날짜 YYYY-MM-DD (로컬 기준) */
function todayStr(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

/** 출발일이 지난(오늘 이전) 상품 여부 — 고객 노출에서 자동 숨김용 */
export function isPastVoyage(v: Voyage): boolean {
  return v.departDate < todayStr();
}

/** 지난 상품을 제외한 목록 (고객 화면 전용) */
export function upcomingVoyages(list: Voyage[]): Voyage[] {
  return list.filter((v) => !isPastVoyage(v));
}

/** 발행된(공개) 상품만 — 임시저장(published===false)은 고객 화면에서 숨김 */
export function publishedVoyages(list: Voyage[]): Voyage[] {
  return list.filter((v) => v.published !== false);
}

/** 같은 크루즈 판정 키: 선박 + 권역 + 박/일 (날짜만 다른 동일 상품) */
export function groupKey(v: Voyage): string {
  return `${v.shipName}|${v.region}|${v.nights}|${v.days}`;
}

/** all 중 v 와 같은 그룹(동일 크루즈)인 일정들을 출발일 오름차순으로 반환 */
export function siblingsOf(all: Voyage[], v: Voyage): Voyage[] {
  const key = groupKey(v);
  return all
    .filter((x) => groupKey(x) === key)
    .sort((a, b) => a.departDate.localeCompare(b.departDate));
}

/** 권역 등으로 그룹핑하여 그룹별 대표(가장 이른 출발일) + 멤버 목록 반환 */
export function groupVoyages(all: Voyage[]): { rep: Voyage; members: Voyage[] }[] {
  const map = new Map<string, Voyage[]>();
  for (const v of all) {
    const k = groupKey(v);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(v);
  }
  return Array.from(map.values()).map((members) => {
    const sorted = [...members].sort((a, b) => a.departDate.localeCompare(b.departDate));
    return { rep: sorted[0], members: sorted };
  });
}
