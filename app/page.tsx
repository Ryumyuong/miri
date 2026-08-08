import SiteHeader from "@/components/site/SiteHeader";
import SiteHero from "@/components/site/SiteHero";
import FeaturedCruisesLive from "@/components/site/FeaturedCruisesLive";
import RegionStories from "@/components/site/RegionStories";
import WhyMiri from "@/components/site/WhyMiri";
import CruiseFinder from "@/components/site/CruiseFinder";
import CruiseGuide from "@/components/site/CruiseGuide";
import ReviewsLive from "@/components/site/ReviewsLive";
import SupportCenter from "@/components/site/SupportCenter";
import FinalCta from "@/components/site/FinalCta";
import SiteFooter from "@/components/site/SiteFooter";
import { regionStories } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <SiteHeader />
      <SiteHero />

      {/* 두 번째 섹션 — ≤990px: 히어로 아래 여백 제거(검색바는 그대로 오버랩) */}
      <div className="bg-white pb-52 pt-52 max-[991px]:pb-16 max-[991px]:pt-0">
        <FeaturedCruisesLive />
      </div>

      {/* 세 번째 섹션: 지역 스토리 커버플로우 */}
      <RegionStories stories={regionStories} />

      {/* 네 번째 섹션: 미리크루즈가 특별한 이유 */}
      <WhyMiri />

      {/* 다섯 번째 섹션: 내게 맞는 크루즈 찾기 */}
      <CruiseFinder />

      {/* 여섯 번째 섹션: 크루즈 가이드 미리보기 */}
      <CruiseGuide />

      {/* 일곱 번째 섹션: 고객 후기 */}
      <ReviewsLive />

      {/* 여덟 번째 섹션: 고객센터 */}
      <SupportCenter />

      {/* 아홉 번째 섹션: 마지막 CTA */}
      <FinalCta topButton={{ label: "출항일정보기 →", href: "/cruises" }} />

      {/* 푸터 */}
      <SiteFooter />
    </div>
  );
}
