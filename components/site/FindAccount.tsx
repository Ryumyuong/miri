"use client";

import { useState } from "react";
import Link from "next/link";
import { findMemberId, verifyForReset, resetPassword } from "@/lib/members";

export default function FindAccount() {
  // 아이디 찾기
  const [fName, setFName] = useState("");
  const [fEmail, setFEmail] = useState("");
  const [foundId, setFoundId] = useState<string | null | undefined>(undefined);

  // 비밀번호 찾기
  const [pId, setPId] = useState("");
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [verified, setVerified] = useState<boolean | undefined>(undefined);
  const [newPw, setNewPw] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const doFindId = async (e: React.FormEvent) => {
    e.preventDefault();
    setFoundId(await findMemberId(fName, fEmail));
  };

  const doVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerified(await verifyForReset(pId, pName, pEmail));
    setPwDone(false);
  };

  const doReset = async () => {
    if (newPw.length < 4 || newPw.length > 20) {
      alert("비밀번호는 4~20자로 입력해 주세요.");
      return;
    }
    await resetPassword(pId, newPw);
    setPwDone(true);
  };

  return (
    <div className="mx-auto w-full max-w-md px-5" style={{ fontSize: "var(--font-base)" }}>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm max-[501px]:p-6">
        {/* 아이디 찾기 */}
        <h2 className="mb-3 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">아이디 찾기</h2>
        <form onSubmit={doFindId}>
          <input className={inp} value={fName} onChange={(e) => setFName(e.target.value)} placeholder="이름" required />
          <input type="email" className={`${inp} mt-2.5`} value={fEmail} onChange={(e) => setFEmail(e.target.value)} placeholder="이메일" required />
          <button type="submit" className="mt-3 w-full rounded-lg bg-navy py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark">확인</button>
        </form>
        {foundId !== undefined && (
          <p className={`mt-3 rounded-lg px-4 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] ${foundId ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
            {foundId ? <>회원님의 아이디는 <b>{foundId}</b> 입니다.</> : "일치하는 회원 정보가 없습니다."}
          </p>
        )}

        <div className="my-7 h-px w-full bg-slate-100" />

        {/* 비밀번호 찾기 */}
        <h2 className="mb-3 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">비밀번호 찾기</h2>
        <form onSubmit={doVerify}>
          <input className={inp} value={pId} onChange={(e) => setPId(e.target.value)} placeholder="아이디" required />
          <input className={`${inp} mt-2.5`} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="이름" required />
          <input type="email" className={`${inp} mt-2.5`} value={pEmail} onChange={(e) => setPEmail(e.target.value)} placeholder="이메일" required />
          <button type="submit" className="mt-3 w-full rounded-lg bg-navy py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark">확인</button>
        </form>
        {verified === false && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-red-600">일치하는 회원 정보가 없습니다.</p>
        )}
        {verified === true && !pwDone && (
          <div className="mt-3 rounded-lg bg-slate-50 p-4">
            <p className="mb-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600">본인 확인 완료 — 새 비밀번호를 설정하세요.</p>
            <div className="flex gap-2">
              <input type="password" className={inp} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="새 비밀번호 (4~20자)" />
              <button type="button" onClick={doReset} className="shrink-0 rounded-lg bg-brand px-4 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-blue-700">변경</button>
            </div>
          </div>
        )}
        {pwDone && (
          <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-emerald-700">
            비밀번호가 변경되었습니다. <Link href="/login" className="font-bold underline">로그인하기</Link>
          </p>
        )}

        <p className="mt-6 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
          <Link href="/login" className="font-semibold text-brand hover:underline">← 로그인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-4 py-3 text-[1.25em] outline-none focus:border-brand";
