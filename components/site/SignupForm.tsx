"use client";

import { useState } from "react";
import Link from "next/link";
import { signupMember, checkIdAvailable } from "@/lib/members";
import { openPostcode } from "@/lib/postcode";

const empty = {
  id: "", pw: "", pw2: "", name: "", engLast: "", engFirst: "",
  gender: "남자", birth: "", phone1: "", phone2: "", phone3: "",
  zip: "", addr1: "", addr2: "", email: "",
  emailConsent: true, smsConsent: true,
};

export default function SignupForm() {
  const [f, setF] = useState(empty);
  const [idChecked, setIdChecked] = useState<null | boolean>(null); // null=미확인
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof empty, v: string | boolean) => {
    setF((p) => ({ ...p, [k]: v }));
    if (k === "id") setIdChecked(null);
  };

  const checkId = async () => {
    if (!/^[a-z0-9_]{4,20}$/.test(f.id)) {
      setError("아이디는 영소문자·숫자·_(언더바) 4~20자로 입력해 주세요.");
      return;
    }
    setError("");
    const ok = await checkIdAvailable(f.id);
    setIdChecked(ok);
    alert(ok ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[a-z0-9_]{4,20}$/.test(f.id)) return setError("아이디 형식을 확인해 주세요. (영소문자·숫자·_ 4~20자)");
    if (idChecked !== true) return setError("아이디 중복확인을 해주세요.");
    if (f.pw.length < 4 || f.pw.length > 20) return setError("비밀번호는 4~20자로 입력해 주세요.");
    if (f.pw !== f.pw2) return setError("비밀번호가 일치하지 않습니다.");
    if (!f.name) return setError("이름을 입력해 주세요.");
    if (!f.birth) return setError("생년월일을 입력해 주세요.");
    const phone = [f.phone1, f.phone2, f.phone3].filter(Boolean).join("-");
    if (!f.phone1 || !f.phone2 || !f.phone3) return setError("휴대폰 번호를 입력해 주세요.");
    if (!f.zip || !f.addr1) return setError("주소를 입력해 주세요.");
    if (!f.email) return setError("이메일을 입력해 주세요.");

    setBusy(true);
    try {
      await signupMember({
        id: f.id, pw: f.pw, name: f.name,
        engLast: f.engLast, engFirst: f.engFirst,
        gender: f.gender, birth: f.birth, phone,
        zip: f.zip, addr1: f.addr1, addr2: f.addr2, email: f.email,
        emailConsent: f.emailConsent, smsConsent: f.smsConsent,
      });
      setDone(true);
    } catch (err) {
      setError((err as Error).message ?? "회원가입 중 오류가 발생했습니다.");
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw]">🎉</p>
        <h3 className="mt-3 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">회원가입이 완료되었습니다!</h3>
        <p className="mt-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">{f.name}님, 미리크루즈의 회원이 되신 것을 환영합니다.</p>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-navy px-6 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark">
          로그인하러 가기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm max-[501px]:p-6" style={{ fontSize: "var(--font-base)" }}>
      <Row label="아이디" required>
        <div className="flex gap-2">
          <input className={inp} value={f.id} onChange={(e) => set("id", e.target.value)} placeholder="아이디" />
          <button type="button" onClick={checkId} className="shrink-0 rounded-lg border border-slate-300 px-4 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">
            중복확인
          </button>
        </div>
        <Hint className={idChecked === true ? "text-emerald-600" : idChecked === false ? "text-red-500" : ""}>
          {idChecked === true ? "사용 가능한 아이디입니다." : "영소문자, 숫자, _(언더바)로 4~20자까지 가능합니다."}
        </Hint>
      </Row>

      <Row label="비밀번호" required>
        <input type="password" className={inp} value={f.pw} onChange={(e) => set("pw", e.target.value)} />
        <Hint>4~20자로 입력해 주세요.</Hint>
      </Row>
      <Row label="비밀번호 확인" required>
        <input type="password" className={inp} value={f.pw2} onChange={(e) => set("pw2", e.target.value)} />
        <Hint>다시 한번 비밀번호를 입력해 주세요.</Hint>
      </Row>

      <Row label="이름" required>
        <input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="홍길동" />
      </Row>
      <Row label="영문 성">
        <input className={inp} value={f.engLast} onChange={(e) => set("engLast", e.target.value)} placeholder="여권에 기재된 영문 ex) Hong" />
      </Row>
      <Row label="영문 이름">
        <input className={inp} value={f.engFirst} onChange={(e) => set("engFirst", e.target.value)} placeholder="ex) GilDong" />
      </Row>

      <Row label="성별" required>
        <select className={`${inp} max-w-[10rem]`} value={f.gender} onChange={(e) => set("gender", e.target.value)}>
          <option>남자</option>
          <option>여자</option>
        </select>
      </Row>
      <Row label="생년월일" required>
        <input type="date" className={`${inp} max-w-[14rem]`} value={f.birth} onChange={(e) => set("birth", e.target.value)} />
      </Row>

      <Row label="휴대폰" required>
        <div className="flex items-center gap-2">
          <input className={`${inp} text-center`} maxLength={3} value={f.phone1} onChange={(e) => set("phone1", e.target.value)} placeholder="010" />
          <span className="text-slate-400">-</span>
          <input className={`${inp} text-center`} maxLength={4} value={f.phone2} onChange={(e) => set("phone2", e.target.value)} placeholder="0000" />
          <span className="text-slate-400">-</span>
          <input className={`${inp} text-center`} maxLength={4} value={f.phone3} onChange={(e) => set("phone3", e.target.value)} placeholder="0000" />
        </div>
      </Row>

      <Row label="주소" required>
        <div className="flex gap-2">
          <input className={`${inp} max-w-[10rem]`} value={f.zip} readOnly placeholder="우편번호" />
          <button
            type="button"
            onClick={() => openPostcode((zip, address) => setF((p) => ({ ...p, zip, addr1: address })))}
            className="shrink-0 rounded-lg border border-slate-300 px-4 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50"
          >
            우편번호검색
          </button>
        </div>
        <input className={`${inp} mt-2`} value={f.addr1} readOnly placeholder="기본주소" />
        <input className={`${inp} mt-2`} value={f.addr2} onChange={(e) => set("addr2", e.target.value)} placeholder="상세주소" />
      </Row>

      <Row label="이메일" required>
        <input type="email" className={inp} value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="example@email.com" />
        <Hint>다음/한메일은 수신이 안될 수 있습니다.</Hint>
      </Row>

      <Row label="이메일 수신 동의">
        <Consent value={f.emailConsent} onChange={(v) => set("emailConsent", v)} />
      </Row>
      <Row label="SMS 수신 동의">
        <Consent value={f.smsConsent} onChange={(v) => set("smsConsent", v)} />
      </Row>

      {error && <p className="mb-4 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-medium text-red-500">{error}</p>}

      <button type="submit" disabled={busy} className="w-full rounded-lg bg-navy py-3.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark disabled:opacity-50">
        {busy ? "가입 중…" : "회원가입"}
      </button>
      <p className="mt-5 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
        이미 회원이신가요?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">로그인</Link>
      </p>
    </form>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[1.25em] outline-none focus:border-brand";

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5 grid grid-cols-[7rem_1fr] items-start gap-3 max-[501px]:grid-cols-1 max-[501px]:gap-1">
      <label className="pt-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-navy max-[501px]:pt-0">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div>{children}</div>
    </div>
  );
}

function Hint({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`mt-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400 ${className}`}>{children}</p>;
}

function Consent({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-5 pt-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-600">
      <label className="flex cursor-pointer items-center gap-1.5">
        <input type="radio" checked={value} onChange={() => onChange(true)} className="accent-brand" /> 수신
      </label>
      <label className="flex cursor-pointer items-center gap-1.5">
        <input type="radio" checked={!value} onChange={() => onChange(false)} className="accent-slate-400" /> 수신거부
      </label>
    </div>
  );
}
