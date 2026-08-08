"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { addConsult } from "@/lib/consults";

// 네이버 광고 전환추적 계정(wa / AccountId) — 공통 인증키와 동일
const WA = "s_34e9bc1156e6";

/**
 * 상담완료 시 네이버 광고 '신청 완료(lead)' 전환 이벤트 전송.
 * lead = 사용자가 연락처를 남기고 상담 등을 신청하는 시점 (상담신청 완료 페이지/구문).
 * 네이버 자가설치 가이드 규격: wcs.trans({ type: 'lead' })
 * (lead 이벤트는 _conv.items 분석 미지원 — 항목 불필요)
 */
function fireConsultConversion() {
  const w = window as unknown as {
    wcs_add?: Record<string, string>;
    wcs?: { trans?: (conv: Record<string, string>) => void };
  };
  if (!w.wcs || typeof w.wcs.trans !== "function") return; // wcslog.js 미로드 시 스킵
  w.wcs_add = w.wcs_add || {};
  w.wcs_add["wa"] = WA;
  const _conv: Record<string, string> = { type: "lead" };
  w.wcs.trans(_conv);
}

export default function ConsultForm({
  voyageTitle,
  onClose,
}: {
  voyageTitle?: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [message, setMessage] = useState(voyageTitle ? `[${voyageTitle}] ` : "");
  const [agree, setAgree] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const converted = useRef(false);

  // 상담완료 화면 진입 시 전환추적 1회 발생
  useEffect(() => {
    if (!done || converted.current) return;
    converted.current = true;
    fireConsultConversion();
  }, [done]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !agree) return;
    setSaving(true);
    try {
      await addConsult({
        customerName: name,
        phone,
        topic: (region ? `[관심지역: ${region}] ` : "") + message.trim(),
        status: "신규",
        createdAt: new Date().toISOString().slice(0, 10),
      });
      setDone(true);
    } catch (err) {
      alert("문의 접수 실패: " + (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" style={{ fontSize: "var(--font-base)" }} onClick={onClose}>
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white px-6 pt-6 pb-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-8 text-center">
            <p className="text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw]">✅</p>
            <h2 className="mt-3 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">문의가 접수되었습니다</h2>
            <p className="mt-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">담당 상담원이 확인 후 빠르게 연락드리겠습니다.</p>
            <button onClick={onClose} className="mt-6 rounded-lg bg-navy px-6 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark">
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">상담 문의하기</h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="mb-5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">크루즈 여행 전문가가 친절하게 상담해드립니다</p>

            <Field label="이름" required>
              <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" required />
            </Field>
            <Field label="연락처" required>
              <input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" required />
            </Field>
            <Field label="관심 지역">
              <input className={inp} value={region} onChange={(e) => setRegion(e.target.value)} placeholder="예: 지중해, 알래스카" />
            </Field>
            <Field label="상담 내용">
              <textarea className={inp} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="문의하실 내용을 자유롭게 작성해주세요" />
            </Field>

            {/* 개인정보 수집·이용 동의 */}
            <div className="mb-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left">
              <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-bold text-slate-700">개인정보 수집·이용 동의</p>
              <p className="mt-1 text-[min(0.7154vw,13.7364px)] max-[991px]:text-[min(2.2308vw,13.3848px)] max-[501px]:text-[2.7085vw] leading-relaxed text-slate-500">
                회사는 이용자의 개인정보를 처리(수집·이용·제공·조회 등)하기 위해 동의를 받으며, 제공하신 개인정보는 그 목적에 부합하는 용도로만 사용됩니다.
              </p>
              <p className="mt-2 text-[min(0.7154vw,13.7364px)] max-[991px]:text-[min(2.2308vw,13.3848px)] max-[501px]:text-[2.7085vw] font-semibold text-slate-600">① 수집·이용 목적</p>
              <ul className="mt-0.5 space-y-0.5 text-[min(0.7154vw,13.7364px)] max-[991px]:text-[min(2.2308vw,13.3848px)] max-[501px]:text-[2.7085vw] leading-relaxed text-slate-500">
                <li>◎ 상담 답변 관련 연락 및 안내</li>
                <li>◎ 상품 안내 및 가입 안내</li>
              </ul>
              <p className="mt-2 text-[min(0.7154vw,13.7364px)] max-[991px]:text-[min(2.2308vw,13.3848px)] max-[501px]:text-[2.7085vw] font-semibold text-slate-600">② 수집 항목</p>
              <ul className="mt-0.5 space-y-0.5 text-[min(0.7154vw,13.7364px)] max-[991px]:text-[min(2.2308vw,13.3848px)] max-[501px]:text-[2.7085vw] leading-relaxed text-slate-500">
                <li>◎ 이름, 연락처, 관심지역, 상담내용, 쿠키·접속 IP</li>
              </ul>
              <p className="mt-2 text-[min(0.7154vw,13.7364px)] max-[991px]:text-[min(2.2308vw,13.3848px)] max-[501px]:text-[2.7085vw] font-semibold text-slate-600">③ 보유·이용 기간</p>
              <ul className="mt-0.5 space-y-0.5 text-[min(0.7154vw,13.7364px)] max-[991px]:text-[min(2.2308vw,13.3848px)] max-[501px]:text-[2.7085vw] leading-relaxed text-slate-500">
                <li>◎ 상담 완료 후 3년 (관계 법령에 따름)</li>
              </ul>
              <p className="mt-2 text-[min(0.7154vw,13.7364px)] max-[991px]:text-[min(2.2308vw,13.3848px)] max-[501px]:text-[2.7085vw] text-slate-400">
                자세한 내용은{" "}
                <Link href="/privacy" target="_blank" className="font-semibold text-[#1E4D8B] underline">
                  개인정보처리방침
                </Link>
                을 확인하세요. 동의 거부 시 상담 접수가 제한됩니다.
              </p>
              <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-700">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="h-4 w-4 shrink-0 accent-[#1E4D8B]" />
                위 개인정보 수집·이용에 동의합니다. <span className="text-red-500">(필수)</span>
              </label>
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">
                닫기
              </button>
              <button type="submit" disabled={saving || !agree} className="rounded-lg bg-[#1E4D8B] px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:brightness-110 disabled:opacity-50">
                {saving ? "접수 중…" : "상담 신청"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[1.25em] outline-none focus:border-brand";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-left text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
