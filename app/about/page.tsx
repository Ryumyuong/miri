import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import AboutTabs from "@/components/site/AboutTabs";

export const metadata = {
  title: "미리크루즈 이용안내 | 미리크루즈",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader solid />

      {/* 위쪽 여백은 '크루즈 여행 가이드' 페이지와 동일 (pt-44 / 모바일 pt-24) */}
      <main className="flex-1 overflow-x-hidden pt-44 pb-32 max-[991px]:pt-24 max-[991px]:pb-16">
        <div className="mb-24 text-center max-[991px]:mb-8 max-[991px]:px-[4%]">
          {/* 눈썹·제목·설명 크기는 '크루즈 여행 가이드' 페이지와 동일 */}
          <p className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[3.5vw] font-bold tracking-[0.43em] text-[#DBBA5D]">
            START YOUR CRUISE
          </p>
          <h1 className="mt-3 text-[min(2.75vw,52.8px)] max-[991px]:text-[min(8.5653vw,51.3918px)] max-[501px]:text-[8.6vw] font-extrabold tracking-tight text-navy">
            처음 만나는 미리크루즈
          </h1>
          <p className="mt-4 text-[min(1.2705vw,24.3936px)] max-[991px]:text-[min(3.9572vw,23.7432px)] max-[501px]:text-[3.97vw] font-medium leading-relaxed text-[#242424]">
            상품 선택부터 여행지, 회원 이용과 계약까지
            <br />
            미리크루즈를 이용하기 위해 필요한 정보를 한곳에 모았습니다.
          </p>
        </div>

        <AboutTabs />
      </main>

      <SiteFooter />
    </div>
  );
}
