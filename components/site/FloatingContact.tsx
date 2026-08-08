"use client";

import { usePathname } from "next/navigation";

/**
 * 우측 하단 고정 전화·카카오톡 플로팅 (관리자 페이지 제외)
 *  · 버튼을 누르면 바로 연결(전화 tel: / 카카오 채팅) — PC·모바일 동일.
 */
const TEL = "tel:1644-8868";
const KAKAO = "https://pf.kakao.com/_xolGWn/chat";

export default function FloatingContact() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const btn =
    "grid h-14 w-14 shrink-0 place-items-center rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition max-[991px]:h-12 max-[991px]:w-12";

  return (
    <div
      className="fixed bottom-12 right-12 z-40 flex flex-col items-end gap-4 max-[991px]:bottom-8 max-[991px]:right-8"
      style={{ fontSize: "var(--font-base)" }}
    >
      {/* 전화 — 바로 연결 */}
      <a href={TEL} aria-label="전화상담" className={`${btn} bg-[#1E4D8B] text-white hover:brightness-110`}>
        <PhoneIcon />
      </a>

      {/* 카카오톡 — 바로 연결 */}
      <a href={KAKAO} target="_blank" rel="noreferrer" aria-label="카카오톡 상담" className={`${btn} bg-[#FEE500] hover:brightness-95`}>
        <KakaoIcon />
      </a>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 max-[991px]:h-7 max-[991px]:w-7" fill="currentColor" aria-hidden>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.07 21 3 13.93 3 5c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons/kakao.png" alt="" className="h-7 w-7 object-contain max-[991px]:h-6 max-[991px]:w-6" />
  );
}
