import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import FaqBoard from "@/components/site/FaqBoard";

export const metadata = {
  title: "자주 묻는 질문 | 미리크루즈",
};

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader solid />

      <main className="flex-1 pt-44 pb-52 max-[991px]:pt-24 max-[991px]:pb-16" style={{ fontSize: "var(--font-base)" }}>
        {/* 헤더 */}
        <div className="mb-24 text-center max-[991px]:mb-8">
          <p className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[3.5vw] font-bold tracking-[0.43em] text-[#DBBA5D]">FAQ</p>
          <h1 className="mt-3 text-[min(2.75vw,52.8px)] max-[991px]:text-[min(8.5653vw,51.3918px)] max-[501px]:text-[8.6vw] font-extrabold tracking-tight text-black">자주 묻는 질문</h1>
          <p className="mt-4 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[3.97vw] font-medium leading-relaxed text-[#242424]">
            크루즈 여행에 대한 궁금증을 해결해드립니다
          </p>
        </div>

        <FaqBoard />
      </main>

      <SiteFooter />
    </div>
  );
}
