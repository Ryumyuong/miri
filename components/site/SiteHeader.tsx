"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * 스크롤 반응형 고정 헤더.
 *  · 최상단(투명): 히어로 위에 흰색 로고 + 흰 글자
 *  · 스크롤(solid): 흰 배경 + 그림자 + 컬러 로고 + 진한 글자
 * 모든 크기는 em(+ 루트 fontSize clamp)으로 잡아 화면 폭에 비례해 스케일됩니다.
 */

type NavItem = {
  label: string;
  caret: boolean;
  active: boolean;
  href: string;
  children?: { label: string; href: string }[];
};

const NAV: NavItem[] = [
  {
    label: "멤버십",
    caret: true,
    active: false,
    href: "/about",
    children: [
      { label: "회사소개", href: "/about" },
      { label: "The Prime", href: "/prime" },
    ],
  },
  {
    label: "크루즈일정/예약",
    caret: true,
    active: false,
    href: "/cruises",
    children: [
      { label: "서부지중해", href: `/cruises?region=${encodeURIComponent("서부지중해")}` },
      { label: "동부지중해", href: `/cruises?region=${encodeURIComponent("동부지중해")}` },
      { label: "북유럽", href: `/cruises?region=${encodeURIComponent("북유럽")}` },
      { label: "미주·알래스카", href: `/cruises?region=${encodeURIComponent("미주·알래스카")}` },
      { label: "중동", href: `/cruises?region=${encodeURIComponent("중동")}` },
      { label: "동남아/동북아", href: `/cruises?region=${encodeURIComponent("동남아/동북아")}` },
    ],
  },
  { label: "크루즈 가이드", caret: false, active: false, href: "/guide" },
  { label: "여행후기", caret: false, active: false, href: "/reviews" },
  {
    label: "고객센터",
    caret: true,
    active: false,
    href: "/faq",
    children: [
      { label: "자주묻는질문", href: "/faq" },
      { label: "예약조회", href: "/reservation" },
    ],
  },
];

/** solid=true 면 히어로 없는 서브페이지에서 항상 흰 배경(컬러 로고) 유지 */
export default function SiteHeader({ solid = false }: { solid?: boolean }) {
  const [scrolledState, setScrolledState] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null); // 모바일 아코디언: 펼친 하위메뉴 라벨
  const scrolled = solid || scrolledState;

  useEffect(() => {
    if (solid) return;
    const onScroll = () => setScrolledState(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  // 로그인 상태 (localStorage): 관리자 / 일반회원
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUser, setIsUser] = useState(false);
  useEffect(() => {
    const sync = () => {
      setIsAdmin(localStorage.getItem("miri-admin") === "1");
      setIsUser(!!localStorage.getItem("miri-user"));
    };
    sync();
    window.addEventListener("miri-auth", sync);
    return () => window.removeEventListener("miri-auth", sync);
  }, []);
  const loggedIn = isAdmin || isUser;
  const logout = () => {
    localStorage.removeItem("miri-admin");
    localStorage.removeItem("miri-user");
    localStorage.removeItem("miri-user-id");
    localStorage.removeItem("miri-guest");
    window.dispatchEvent(new Event("miri-auth"));
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-black/20"
      }`}
      style={{ fontSize: "var(--font-base)" }}
    >
      <nav className="flex items-center justify-between px-[2.6em] py-[1.2em]">
        {/* 로고 (스크롤 여부에 따라 흰색/컬러 교체) */}
        <Link href="/" className="shrink-0">
          <img
            src={scrolled ? "/logo-color.png" : "/logo-white.png"}
            alt="미리크루즈"
            className="h-[2.7em] w-auto"
          />
        </Link>

        {/* 데스크톱 메뉴 (>990px) */}
        <ul
          className={`flex items-center gap-[2.8em] text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-medium max-[991px]:hidden ${
            scrolled ? "text-slate-700" : "text-white"
          }`}
          style={{ fontFamily: "Inter, var(--font-sans)", fontWeight: 500 }}
        >
          {NAV.map((n) => (
            <li key={n.label} className="group relative">
              <Link
                href={n.href}
                className={`inline-flex items-center gap-[0.45em] py-[0.5em] transition ${
                  n.active
                    ? scrolled
                      ? "font-bold text-brand"
                      : "font-bold text-gold"
                    : scrolled
                      ? "hover:text-brand"
                      : "hover:text-gold"
                }`}
              >
                {n.label}
                {n.caret && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/icons/caret.png"
                    alt=""
                    className={`h-[0.5em] w-auto object-contain ${scrolled ? "brightness-0 opacity-60" : ""}`}
                  />
                )}
              </Link>
              {n.children && (
                <ul className="invisible absolute left-0 top-full z-50 min-w-[9em] translate-y-[0.4em] rounded-[0.4em] bg-white py-[0.4em] text-[0.85em] text-[#0B2A4A] opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {n.children.map((c) => (
                    <li key={c.label}>
                      <Link
                        href={c.href}
                        className="block whitespace-nowrap px-[1.3em] py-[0.7em] font-medium transition hover:bg-slate-50 hover:text-brand"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>

        {/* 우측 버튼 묶음 (>990px) */}
        <div className="flex items-center gap-[1em] max-[991px]:hidden">
          {loggedIn ? (
            <>
              {isUser && (
                <Link
                  href="/mypage"
                  className={`text-[min(0.7315vw,14.0448px)] max-[991px]:text-[min(2.2784vw,13.6704px)] max-[501px]:text-[2.767vw] ${scrolled ? "text-slate-500 hover:text-brand" : "text-white/90 hover:text-gold"}`}
                >
                  마이페이지
                </Link>
              )}
              <button
                onClick={logout}
                className={`inline-flex items-center gap-[0.4em] text-[min(0.7315vw,14.0448px)] max-[991px]:text-[min(2.2784vw,13.6704px)] max-[501px]:text-[2.767vw] ${scrolled ? "text-slate-500 hover:text-brand" : "text-white/90 hover:text-gold"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/logout.png" alt="" className={`h-[1.1em] w-[1.1em] object-contain ${scrolled ? "brightness-0 opacity-60" : ""}`} />
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-[min(0.7315vw,14.0448px)] max-[991px]:text-[min(2.2784vw,13.6704px)] max-[501px]:text-[2.767vw] ${scrolled ? "text-slate-500 hover:text-brand" : "text-white/90 hover:text-gold"}`}
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className={`text-[min(0.7315vw,14.0448px)] max-[991px]:text-[min(2.2784vw,13.6704px)] max-[501px]:text-[2.767vw] ${scrolled ? "text-slate-500 hover:text-brand" : "text-white/90 hover:text-gold"}`}
              >
                회원가입
              </Link>
            </>
          )}
          <Link
            href="/prime"
            className="rounded-none bg-[#C9A961] px-[1.9em] py-[0.4em] text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-normal text-white"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            The Prime
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-none bg-[#000000] px-[1.9em] py-[0.4em] text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-semibold text-white"
            >
              관리자모드
            </Link>
          ) : (
            <Link
              href="/reservation"
              className="rounded-none bg-[#09264B] px-[1.9em] py-[0.4em] text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-semibold text-white"
            >
              예약조회
            </Link>
          )}
        </div>

        {/* 햄버거 (≤990px) */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="메뉴 열기"
          className="hidden flex-col gap-[0.35em] p-[0.4em] max-[991px]:flex"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`block h-[0.18em] w-[1.7em] rounded ${scrolled ? "bg-slate-700" : "bg-white"}`}
            />
          ))}
        </button>
      </nav>

      {/* 모바일 드롭다운 (≤990px) */}
      {menuOpen && (
        <div className="hidden border-t border-slate-200 bg-white px-[2.6em] py-[1.2em] text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.2039vw] text-slate-700 shadow-lg max-[991px]:block">
          <ul className="flex flex-col gap-[0.9em]">
            {NAV.map((n) => (
              <li key={n.label}>
                {/* 라벨은 링크로 이동, 화살표는 하위 메뉴 펼침/접힘(아코디언) */}
                <div className="flex items-center justify-between">
                  <Link
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className={n.active ? "font-bold text-brand" : "hover:text-brand"}
                  >
                    {n.label}
                  </Link>
                  {n.children && (
                    <button
                      type="button"
                      aria-label={`${n.label} 하위 메뉴`}
                      aria-expanded={openSub === n.label}
                      onClick={() => setOpenSub((v) => (v === n.label ? null : n.label))}
                      className="px-[0.6em] py-[0.2em] text-slate-400 hover:text-brand"
                    >
                      <span className={`inline-block transition-transform ${openSub === n.label ? "rotate-180" : ""}`}>▾</span>
                    </button>
                  )}
                </div>
                {n.children && openSub === n.label && (
                  <ul className="mt-[0.6em] ml-[1em] flex flex-col gap-[0.6em] border-l border-slate-200 pl-[1em]">
                    {n.children.map((c) => (
                      <li key={c.label}>
                        <Link
                          href={c.href}
                          onClick={() => setMenuOpen(false)}
                          className="text-slate-500 hover:text-brand"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-[1em] flex flex-wrap items-center gap-[0.8em] border-t border-slate-200 pt-[1em]">
            {loggedIn ? (
              <>
                {isUser && <Link href="/mypage" className="text-slate-500">마이페이지</Link>}
                <button onClick={logout} className="inline-flex items-center gap-[0.4em] text-slate-500">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/icons/logout.png" alt="" className="h-[1.1em] w-[1.1em] object-contain brightness-0 opacity-60" />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-slate-500">로그인</Link>
                <Link href="/signup" className="text-slate-500">회원가입</Link>
              </>
            )}
            <Link href="/prime" className="rounded-[0.3em] bg-gold px-[1em] py-[0.5em] font-bold text-white">
              The Prime
            </Link>
            {isAdmin ? (
              <Link href="/admin" target="_blank" rel="noopener noreferrer" className="rounded-[0.3em] bg-[#0a0e17] px-[1em] py-[0.5em] font-semibold text-white">
                관리자모드
              </Link>
            ) : (
              <Link href="/reservation" className="rounded-[0.3em] bg-navy-dark px-[1em] py-[0.5em] font-semibold text-white">
                예약조회
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
