"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginMember } from "@/lib/members";

// 나중에 실제 연동 시 참고용 (client_id·state 는 실제 값으로 교체 필요):
// 네이버: https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=<ID>&redirect_uri=<CALLBACK>&state=<STATE>
// 카카오/구글/페이스북: 각 SDK 초기화 후 kakaoLogin()/GIS 위젯/facebookLogin() 연결

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"member" | "guest">("member");

  // 회원 로그인
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [saveId, setSaveId] = useState(false);
  // 비회원 로그인
  const [gName, setGName] = useState("");
  const [gEmail, setGEmail] = useState("");
  const [gPhone, setGPhone] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("miri-saved-id");
    if (saved) {
      setId(saved);
      setSaveId(true);
    }
  }, []);

  const memberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // 관리자 데모 계정
    if (id === "admin" && pw === "1234") {
      localStorage.setItem("miri-admin", "1");
      window.dispatchEvent(new Event("miri-auth"));
      router.push("/admin");
      return;
    }
    setBusy(true);
    try {
      const member = await loginMember(id, pw);
      if (member) {
        if (saveId) localStorage.setItem("miri-saved-id", id);
        else localStorage.removeItem("miri-saved-id");
        localStorage.setItem("miri-user", member.name);
        localStorage.setItem("miri-user-id", member.id);
        window.dispatchEvent(new Event("miri-auth"));
        router.push("/");
        return;
      }
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    }
    setBusy(false);
  };

  const guestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!gName || !gPhone) {
      setError("이름과 핸드폰을 입력해 주세요.");
      return;
    }
    localStorage.setItem("miri-user", gName);
    localStorage.setItem("miri-guest", "1");
    window.dispatchEvent(new Event("miri-auth"));
    router.push("/");
  };

  const social = (name: string) => alert(`${name} 로그인은 준비 중입니다.`);

  return (
    <div className="mx-auto w-full max-w-xl px-5 max-[501px]:px-2" style={{ fontSize: "var(--font-base)" }}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* 회원 / 비회원 탭 */}
        <div className="flex px-8 pt-8">
          <TabBtn active={mode === "member"} onClick={() => setMode("member")}>회원 로그인</TabBtn>
          <TabBtn active={mode === "guest"} onClick={() => setMode("guest")}>비회원 로그인</TabBtn>
        </div>

        <div className="px-8 pb-8 pt-5">
          {mode === "member" ? (
            <form onSubmit={memberLogin}>
              <input className={inp} value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디" />
              <input type="password" className={`${inp} mt-2.5`} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" />
              <label className="mt-3 flex cursor-pointer items-center gap-2 text-[min(0.8085vw,15.5232px)] max-[991px]:text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.0582vw] text-slate-500">
                <input type="checkbox" checked={saveId} onChange={(e) => setSaveId(e.target.checked)} className="accent-brand" />
                아이디 저장
              </label>
              {error && <p className="mt-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-red-500">{error}</p>}
              <button type="submit" disabled={busy} className="mt-3 w-full rounded-none bg-navy py-3.5 text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.2039vw] font-normal text-white transition hover:bg-navy-dark disabled:opacity-50">
                {busy ? "로그인 중…" : "로그인"}
              </button>
            </form>
          ) : (
            <form onSubmit={guestLogin}>
              <input className={inp} value={gName} onChange={(e) => setGName(e.target.value)} placeholder="이름" />
              <input type="email" className={`${inp} mt-2.5`} value={gEmail} onChange={(e) => setGEmail(e.target.value)} placeholder="이메일" />
              <input className={`${inp} mt-2.5`} value={gPhone} onChange={(e) => setGPhone(e.target.value)} placeholder="핸드폰" />
              {error && <p className="mt-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-red-500">{error}</p>}
              <button type="submit" className="mt-3 w-full rounded-none bg-navy py-3.5 text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.2039vw] font-normal text-white transition hover:bg-navy-dark">
                비회원 로그인
              </button>
            </form>
          )}

          {/* 소셜 로그인 */}
          <div className="my-5 flex items-center gap-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-300">
            <span className="h-px flex-1 bg-slate-200" /> 간편 로그인 <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex flex-col gap-2">
            <Social onClick={() => social("네이버")} className="bg-[#03C75A] text-white" badge="N" badgeClass="bg-[#03C75A] text-white">네이버로 로그인</Social>
            <Social onClick={() => social("카카오톡")} className="bg-[#FAE100] text-[#381a1c]" badge={/* eslint-disable-next-line @next/next/no-img-element */ <img src="/icons/kakao-talk.png" alt="" className="h-6 w-6 object-contain" />} badgeClass="">카카오톡으로 로그인</Social>
            <Social onClick={() => social("Google")} className="border border-slate-300 bg-white text-[#381a1c]" badge={<GoogleLogo />} badgeClass="bg-white">Google 계정으로 로그인</Social>
            <Social onClick={() => social("페이스북")} className="bg-[#4064ad] text-white" badge="f" badgeClass="bg-[#4064ad] text-white">페이스북으로 로그인</Social>
          </div>
        </div>

        {/* 하단 */}
        <div className="grid grid-cols-2 border-t border-slate-200 text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.2039vw]">
          <a href="/signup" className="flex items-center justify-center gap-1.5 py-4 font-normal text-slate-600 hover:bg-slate-50">
            ✚ 회원가입 하기
          </a>
          <a href="/find-account" className="flex items-center justify-center gap-1.5 border-l border-slate-200 py-4 font-normal text-slate-600 hover:bg-slate-50">
            🔒 아이디/패스워드 찾기
          </a>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-4 py-3 text-[1.25em] outline-none focus:border-brand";

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 border-b-2 pb-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold transition ${active ? "border-navy text-navy" : "border-transparent text-slate-400 hover:text-slate-600"}`}
    >
      {children}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function Social({
  children, onClick, className, badge, badgeClass,
}: {
  children: React.ReactNode; onClick: () => void; className: string; badge: React.ReactNode; badgeClass: string;
}) {
  return (
    <button type="button" onClick={onClick} className={`relative flex h-11 items-center justify-center rounded-none text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.2039vw] font-normal ${className}`}>
      <span className={`absolute left-3 grid h-6 w-6 place-items-center rounded font-black ${badgeClass}`}>{badge}</span>
      {children}
    </button>
  );
}
