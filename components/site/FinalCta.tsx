import Link from "next/link";
import ConsultButton from "./ConsultButton";

type Line = { text: string; color: "navy" | "brand" };
type Btn = { label: string; href: string; variant?: "brand" | "navy" | "navyDark"; consult?: boolean };

const variantClass: Record<string, string> = {
  brand: "bg-[#2B548B] hover:brightness-110",
  navy: "bg-navy hover:bg-navy-dark",
  navyDark: "bg-[#113667] hover:brightness-110",
};

/**
 * 좌측 선박 사진 + 우측 안내/버튼 패널 CTA.
 *  props 로 문구·사진·버튼 구성을 바꿔 홈/상세/프라임에서 재사용.
 */
export default function FinalCta({
  lines = [
    { text: "준비된 여정,", color: "brand" },
    { text: "지금 시작하세요", color: "navy" },
  ],
  descLines = ["전문 상담원이 출항 일정부터 객실,", "출국 준비까지 모두 안내해드립니다."],
  image = "/cta-ship.webp",
  topButton,
  buttons = [
    { label: "상담문의 →", href: "#", variant: "brand", consult: true },
    { label: "전화상담 →", href: "tel:1644-8868", variant: "navyDark" },
  ],
}: {
  lines?: Line[];
  descLines?: [string, string];
  image?: string;
  topButton?: { label: string; href: string };
  buttons?: Btn[];
}) {
  return (
    <section
      className="grid grid-cols-2 items-stretch max-[991px]:grid-cols-1"
      style={{ fontSize: "var(--font-base)" }}
    >
      {/* 좌: 선박 사진 (배는 유지, 위아래(하늘·바다)만 트리밍해 배너 높이 축소) */}
      <div className="relative aspect-[16/9] bg-[#f4f6fa]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="미리크루즈 선박" className="absolute inset-0 h-full w-full object-cover" />
      </div>

      {/* 우: 안내 패널 (상하 여백 축소) */}
      <div className="relative flex flex-col justify-center overflow-hidden bg-[#f4f6fa] px-[max(6.9795vw,calc((100%_-_1920px)/2_+_105.53px))] py-[0.6em] max-[991px]:px-[2.5em] max-[991px]:py-8">
       <div className="relative">
        {/* M 워터마크 — 콘텐츠 우측 상단(버튼 오른쪽·준비된 여정 윗줄)과 정렬 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-watermark.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-[12em] w-[12em] select-none max-[501px]:h-[9em] max-[501px]:w-[9em]"
        />

        <h2 className="relative text-[min(2.2132vw,42.4934px)] max-[991px]:text-[min(6.8934vw,41.3604px)] max-[501px]:text-[7.5vw] font-bold leading-[1.25]">
          {lines.map((l, i) => (
            <span key={i}>
              <span className={l.color === "brand" ? "text-[#1E4D8B]" : "text-black"}>{l.text}</span>
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </h2>
        <p className="relative mt-[0.6em] text-[min(1.045vw,20.064px)] max-[991px]:text-[min(3.2547vw,19.5282px)] max-[501px]:text-[3.56vw] font-medium leading-[1.8] text-black">
          {descLines[0]}
          <br />
          {descLines[1]}
        </p>

        {/* 버튼 */}
        <div className="relative mt-[1.4em] flex flex-col gap-[0.9em] max-[991px]:mt-[2.5em]">
          {topButton && (
            <Link
              href={topButton.href}
              className="rounded-none border-[1.02px] border-[#113667] bg-white py-[0.8em] text-center text-[min(0.9515vw,18.2688px)] max-[991px]:text-[min(2.9636vw,17.7816px)] max-[501px]:text-[3.5991vw] font-semibold text-[#113667] transition hover:bg-[#113667] hover:text-white"
            >
              {topButton.label}
            </Link>
          )}
          <div className="grid grid-cols-2 gap-[0.9em] max-[991px]:grid-cols-1">
            {buttons.map((b) => {
              const cls = `rounded-none py-[0.8em] text-center text-[1.2357em] font-semibold text-white transition ${
                variantClass[b.variant ?? "brand"]
              }`;
              return b.consult ? (
                <ConsultButton key={b.label} className={cls}>
                  {b.label}
                </ConsultButton>
              ) : (
                <Link key={b.label} href={b.href} className={cls}>
                  {b.label}
                </Link>
              );
            })}
          </div>
        </div>
       </div>
      </div>
    </section>
  );
}
