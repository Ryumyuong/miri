import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import GuideGrid from "@/components/site/GuideGrid";
import ContactCta from "@/components/site/ContactCta";

export const metadata = {
  title: "크루즈 여행 가이드 | 미리크루즈",
};

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader solid />

      <main className="flex-1 pt-44 pb-72 max-[991px]:pt-24 max-[991px]:pb-16" style={{ fontSize: "var(--font-base)" }}>
        {/* 헤더 */}
        <div className="mb-24 text-center max-[991px]:mb-8 max-[991px]:px-[4%]">
          <p className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[3.5vw] font-bold tracking-[0.43em] text-[#DBBA5D]">
            CRUISE GUIDE
          </p>
          <h1 className="mt-3 text-[min(2.75vw,52.8px)] max-[991px]:text-[min(8.5653vw,51.3918px)] max-[501px]:text-[8.6vw] font-extrabold tracking-tight">
            <span className="text-brand">크루즈 여행</span>{" "}
            <span className="text-navy">가이드</span>
          </h1>
          <p className="mt-4 text-[min(1.2705vw,24.3936px)] max-[991px]:text-[min(3.9572vw,23.7432px)] max-[501px]:text-[3.97vw] font-medium leading-relaxed text-[#242424]">
            처음 크루즈를 떠나시는 분들을 위한 완벽한 안내서입니다.
            <br />
            승선 전 준비부터 하선까지 모든 정보를 확인하세요.
          </p>
        </div>

        <GuideGrid />
      </main>

      {/* 상담 유도 배너 */}
      <ContactCta />

      <SiteFooter />
    </div>
  );
}
