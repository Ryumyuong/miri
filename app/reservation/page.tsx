import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ReservationLookup from "@/components/site/ReservationLookup";
import Link from "next/link";

export const metadata = {
  title: "예약조회 | 미리크루즈",
};

export default function ReservationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F5F7F9] max-[991px]:bg-white">
      <SiteHeader solid />

      <main className="flex-1 pt-52 pb-52 max-[991px]:pt-32 max-[991px]:pb-16" style={{ fontSize: "var(--font-base)" }}>
        <div className="mx-auto w-full max-w-[70em] px-5">
          {/* 헤더 — 데스크톱: 좌측 제목+부제 / 우측 링크. 모바일: 가운데 세로 정렬 */}
          <div className="mb-8 flex items-center justify-between gap-4 max-[991px]:mb-10 max-[991px]:flex-col max-[991px]:gap-3 max-[991px]:text-center">
            <div className="flex items-baseline gap-4 max-[991px]:flex-col max-[991px]:items-center max-[991px]:gap-2">
              <h1 className="text-[min(2.1323vw,40.9402px)] max-[991px]:text-[min(6.6414vw,39.8484px)] max-[501px]:text-[8.0656vw] font-extrabold text-[#0B2A4A]">예약조회</h1>
              <p className="text-[min(1.0661vw,20.4691px)] max-[991px]:text-[min(3.3207vw,19.9242px)] max-[501px]:text-[4.0328vw] font-medium text-[#5A6B7E]">크루즈 예약 정보와 상담문의 답변을 확인하세요</p>
            </div>
            <Link href="/" className="shrink-0 text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-medium text-[#1E4D8B] hover:underline max-[991px]:hidden">
              ← 홈으로 돌아가기
            </Link>
          </div>

          <ReservationLookup />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
