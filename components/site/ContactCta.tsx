import Link from "next/link";

/** 하단 상담 유도 배너 (배경 사진 + 문의 버튼). 우측 버튼은 페이지별로 커스터마이즈 가능. */
export default function ContactCta({
  heading = "궁금한 점이 있으신가요?",
  actionLabel = "카카오톡 문의",
  actionHref = "https://pf.kakao.com/_xolGWn/chat",
}: {
  heading?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <section
      className="relative bg-navy bg-cover bg-center py-32 text-center text-white"
      style={{
        fontSize: "var(--font-base)",
        backgroundImage: "url('/contact-cta-bg.png')",
      }}
    >
      <h2 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-black">{heading}</h2>
      <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-white/80">
        크루즈 여행 전문 상담사가 친절하게 안내해 드립니다
      </p>
      <div className="mt-7 flex justify-center gap-3">
        <Link
          href="tel:1644-8868"
          className="rounded-none bg-white px-6 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-[#1E4D8B] transition hover:bg-slate-100"
        >
          전화 상담 신청
        </Link>
        <Link
          href={actionHref}
          className="rounded-none border border-white/60 px-6 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-white/10"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
