"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 관리자 접근 게이트 — 회원 로그인창에서 admin 계정으로 로그인해야 관리자 화면이 보인다.
 *  · 로그인 판정은 회원 로그인 폼(LoginForm)이 저장하는 "miri-admin" 세션으로 통일.
 *  · 미로그인 상태로 /admin 접근 시 별도 관리자 로그인창 없이 회원 로그인 페이지로 이동.
 */
const KEY = "miri-admin";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let ok = false;
    try {
      ok = localStorage.getItem(KEY) === "1";
    } catch {
      /* localStorage 접근 불가 시 미인증 */
    }
    setAuthed(ok);
    setReady(true);
    if (!ok) router.replace("/login"); // 회원 로그인창으로 이동 (admin/1234 입력 시 관리자 진입)
  }, [router]);

  // 미로그인: 아무것도 노출하지 않고 로그인 페이지로 이동
  if (!ready || !authed) return null;
  return <>{children}</>;
}

/** 헤더용 로그아웃 버튼 */
export function AdminLogout() {
  const logout = () => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
    window.dispatchEvent(new Event("miri-auth"));
    location.href = "/";
  };
  return (
    <span className="flex items-center gap-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">
      관리자
      <button
        type="button"
        onClick={logout}
        className="rounded-md border border-slate-300 px-2.5 py-1 text-[0.85em] font-semibold text-slate-600 transition hover:border-[#1E4D8B] hover:text-[#1E4D8B]"
      >
        로그아웃
      </button>
    </span>
  );
}
