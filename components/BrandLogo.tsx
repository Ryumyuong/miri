import Link from "next/link";

/** 미리크루즈 워드마크. variant="admin"이면 하단에 '관리자모드' 뱃지 표시 */
export default function BrandLogo({
  variant = "default",
  href = "/",
}: {
  variant?: "default" | "admin";
  href?: string;
}) {
  return (
    <Link href={href} className="inline-flex flex-col items-center gap-3" style={{ fontSize: "var(--font-base)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-miri.png" alt="미리크루즈" className="h-16 w-auto max-[991px]:h-10" />
      {variant === "admin" && (
        <span className="block w-full rounded bg-navy-dark py-2 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold tracking-wide text-white">
          관리자모드
        </span>
      )}
    </Link>
  );
}
