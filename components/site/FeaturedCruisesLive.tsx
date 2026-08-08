"use client";

import { useVoyages } from "@/lib/useVoyages";
import { groupVoyages, publishedVoyages } from "@/lib/voyage-group";
import FeaturedCruises from "./FeaturedCruises";

export default function FeaturedCruisesLive() {
  const { voyages, loading } = useVoyages();
  if (loading) {
    return <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400" style={{ fontSize: "var(--font-base)" }}>불러오는 중…</p>;
  }
  // 요금문의(가격 0)·출발일 경과 일정 제외 후, 같은 크루즈는 묶어서 페이징(3개씩) 노출
  // 프라임 상품도 일반 목록에 함께 노출 (프라임 페이지 단독 노출 아님)
  const today = new Date().toISOString().slice(0, 10);
  const pub = publishedVoyages(voyages); // 발행된 상품만
  const priced = pub.filter((v) => v.priceFrom > 0 && v.departDate >= today);
  return <FeaturedCruises groups={groupVoyages(priced)} />;
}
