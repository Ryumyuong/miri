import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import CruiseListLive from "@/components/site/CruiseListLive";

export const metadata = {
  title: "크루즈 여행 일정 | 미리크루즈",
};

export default function CruisesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f6]">
      <SiteHeader solid />

      <main className="flex-1 overflow-x-clip pt-40 pb-52 max-[991px]:pt-24 max-[991px]:pb-16">
        {/* 페이지 타이틀 */}
        <div className="mb-[6rem] text-center max-[991px]:mb-8" style={{ fontSize: "var(--font-base)" }}>
          <h1 className="text-[min(2.75vw,52.8px)] max-[991px]:text-[min(8.5653vw,51.3918px)] max-[501px]:text-[8.6vw] font-extrabold tracking-tight">
            <span className="text-[#1E4D8B]">크루즈 여행</span>{" "}
            <span className="text-[#000000]">일정</span>
          </h1>
          <p className="mt-4 text-[min(1.32vw,25.344px)] max-[991px]:text-[min(4.1114vw,24.6684px)] max-[501px]:text-[3.97vw] font-medium text-[#242424]">
            전 세계 프리미엄 크루즈 여행을 찾아보세요
          </p>
        </div>

        <CruiseListLive />
      </main>

      <SiteFooter />
    </div>
  );
}
