"use client";

import { useVoyages } from "@/lib/useVoyages";
import { groupVoyages, groupKey, publishedVoyages } from "@/lib/voyage-group";
import PrimeCruises from "./PrimeCruises";

/** 프라임 전용 일정 — 유럽·미주알래스카·중동을 우선 노출, 없으면 앞 3건. */
export default function PrimeCruisesLive() {
  const { voyages, loading } = useVoyages();
  if (loading) {
    return <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400" style={{ fontSize: "var(--font-base)" }}>불러오는 중…</p>;
  }
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = publishedVoyages(voyages).filter((v) => v.departDate >= today); // 발행됨 + 출발일 지난 상품 자동 숨김
  // 프라임으로 지정된 크루즈(그룹) 전체를 대상으로, 그룹당 대표 1개씩 노출 순서대로
  const primeGroups = new Set(upcoming.filter((v) => v.isPrime).map((v) => groupKey(v)));
  const inPrime = upcoming.filter((v) => primeGroups.has(groupKey(v)));
  const primes = groupVoyages(inPrime)
    .map((g) => {
      const order = Math.min(...g.members.filter((m) => m.isPrime).map((m) => m.primeOrder ?? 999), 999);
      return { rep: g.rep, order };
    })
    .sort((a, b) => a.order - b.order || a.rep.departDate.localeCompare(b.rep.departDate))
    .map((g) => g.rep);
  // 지정된 프라임이 없으면 지역 자동 선정으로 대체 (전환기 안전장치)
  const fallback = ["유럽", "미주·알래스카", "중동"]
    .map((r) => upcoming.find((v) => v.region === r))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const list = primes.length ? primes : (fallback.length ? fallback : upcoming.slice(0, 3));
  return <PrimeCruises voyages={list} />;
}
