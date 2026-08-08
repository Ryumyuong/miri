import Link from "next/link";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PrimeBenefits from "@/components/site/PrimeBenefits";
import PrimeCruisesLive from "@/components/site/PrimeCruisesLive";
import FinalCta from "@/components/site/FinalCta";
import ConsultButton from "@/components/site/ConsultButton";

export const metadata = {
  title: "The Prime | 미리크루즈",
  description: "미리크루즈의 최상급 프리미엄 크루즈 컬렉션",
};

export default function PrimePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f1722]">
      <SiteHeader solid />

      {/* 히어로 */}
      <section
        className="relative flex items-center justify-center overflow-hidden text-center text-white"
        style={{
          fontSize: "var(--font-base)",
          minHeight: "clamp(460px, 52vw, 720px)",
          backgroundImage: "url('/prime-hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 px-[2em] pb-[11em] pt-[17em] max-[991px]:pb-[6em] max-[991px]:pt-[11em]">
          {/* 프리미엄 컬렉션 뱃지 */}
          <span className="inline-flex items-center gap-[0.6em] rounded-[0.3em] border border-[#C9A961]/40 px-[1.2em] py-[0.6em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-medium tracking-[0.3em] text-[#C9A961]">
            ♔ PREMIUM COLLECTION
          </span>

          {/* 타이틀 */}
          <h1 className="mt-[0.4em] text-[min(4.8019vw,92.1965px)] font-normal leading-none max-[991px]:text-[min(10.7923vw,64.7538px)] max-[501px]:text-[9.0291vw]" style={{ fontFamily: "Georgia, serif" }}>
            <span className="italic text-white/90 max-[991px]:text-white">The</span>{" "}
            <span className="font-semibold text-white/90 max-[991px]:text-white">Prime</span>
          </h1>

          {/* 골드 구분선 */}
          <span className="mx-auto mt-[1em] block h-[2.4em] w-px bg-gold/70" />

          <p className="mt-[1.2em] text-[min(1.4216vw,27.2947px)] max-[991px]:text-[min(4.4277vw,26.5662px)] max-[501px]:text-[5.3772vw] font-semibold text-white/90">
            가장 품격 있는 크루즈 여행
          </p>
          <p className="text-[min(1.0661vw,20.4691px)] max-[991px]:text-[min(3.3207vw,19.9242px)] max-[501px]:text-[4.0328vw] leading-[1.8] text-white/70">
            프리미엄 선박, 최적의 일정, 특급 서비스로 완성되는
            <br />
            미리크루즈의 최상급 컬렉션을 만나보세요
          </p>

          {/* 버튼 */}
          <div className="mt-[4.5em] flex items-center justify-center gap-[1em] max-[991px]:flex-col">
            <Link
              href="#prime-list"
              className="inline-flex items-center gap-[1.6em] rounded-full bg-gold py-[0.5em] pl-[2.2em] pr-[1.3em] text-[min(1.3031vw,25.0195px)] font-bold text-white shadow-lg transition hover:brightness-95 max-[991px]:w-[17em] max-[991px]:justify-center max-[991px]:text-[min(3.1178vw,18.7068px)] max-[501px]:text-[3.7864vw]"
            >
              프라임 일정 보기
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/prime-arrow.png" alt="" className="h-[1.6em] w-[1.6em] object-contain" />
            </Link>
            <ConsultButton
              className="rounded-full border border-white/60 px-[2.2em] py-[0.5em] text-[min(1.3031vw,25.0195px)] font-bold text-white transition hover:bg-white/10 max-[991px]:w-[17em] max-[991px]:text-center max-[991px]:text-[min(3.1178vw,18.7068px)] max-[501px]:text-[3.7864vw]"
            >
              전문상담문의
            </ConsultButton>
          </div>
        </div>
      </section>

      {/* 프라임만의 특별함 */}
      <PrimeBenefits />

      {/* 엄선된 프라임 일정 */}
      <div id="prime-list">
        <PrimeCruisesLive />
      </div>

      {/* 하단 CTA */}
      <FinalCta
        lines={[
          { text: "프라임 여행,", color: "brand" },
          { text: "지금 시작하세요", color: "navy" },
        ]}
        descLines={["전문 상담원이 고객님께 가장 적합한", "프라임 일정을 제안해 드립니다"]}
        image="/cta-ship.webp"
        buttons={[
          { label: "전문 상담 신청 →", href: "/faq", variant: "brand" },
          { label: "전체 일정 보기 →", href: "/cruises", variant: "navyDark" },
        ]}
      />

      <SiteFooter />
    </div>
  );
}
