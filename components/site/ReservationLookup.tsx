"use client";

import { useState } from "react";
import { useReservations } from "@/lib/useReservations";

const digits = (s: string) => s.replace(/[^0-9]/g, "");

// 010-1234-5678 형식으로 자동 하이픈
function formatPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export default function ReservationLookup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingNo, setBookingNo] = useState("");
  const [open, setOpen] = useState(false); // 결과 팝업

  const { reservations } = useReservations();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setOpen(true);
  };

  // 공백·대소문자 무시 정규화
  const norm = (s?: string) => (s ?? "").replace(/\s/g, "").toLowerCase();
  const nq = norm(name);
  const pq = digits(phone);
  const bq = norm(bookingNo);

  // 예약: 예약번호가 맞으면 우선 통과, 아니면 (이름·연락처 일치) — 이름/연락처는 대표+일행 모두 확인
  const matchReservation = (r: (typeof reservations)[number]) => {
    if (bq && norm(r.code) === bq) return true;
    const nameOk = norm(r.name) === nq || (r.passengers?.some((p) => norm(p.nameKo) === nq) ?? false);
    const phoneOk = digits(r.phone) === pq || (r.passengers?.some((p) => digits(p.phone ?? "") === pq) ?? false);
    return nameOk && phoneOk;
  };

  const myReservations = open ? reservations.filter(matchReservation) : [];

  return (
    <div className="w-full" style={{ fontSize: "var(--font-base)" }}>
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm max-[501px]:p-6">
        <Field label="예약자 이름" required>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className={inp} />
        </Field>
        <Field label="연락처" required>
          <input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" inputMode="numeric" maxLength={13} className={inp} />
        </Field>
        <Field label="예약번호 (선택)">
          <input value={bookingNo} onChange={(e) => setBookingNo(e.target.value)} placeholder="MC26-XXXX" className={inp} />
        </Field>
        <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-none bg-[#1E4D8B] py-3.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:brightness-110">
          <svg viewBox="0 0 24 24" fill="none" className="h-[1.2em] w-[1.2em]" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          예약 조회하기
        </button>
      </form>

      {/* 결과 팝업 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[52em] overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">예약 조회 결과</h3>
              <button onClick={() => setOpen(false)} aria-label="닫기" className="text-[min(1.232vw,23.6544px)] max-[991px]:text-[min(3.8373vw,23.0238px)] max-[501px]:text-[4.6602vw] leading-none text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {myReservations.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
                  일치하는 예약(가예약) 내역이 없습니다.
                  <br />
                  <span className="text-[0.9em]">이름·연락처 또는 예약번호를 다시 확인해 주세요.</span>
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {myReservations.map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-gold">가예약</p>
                        {r.code && <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] text-slate-500">{r.code}</span>}
                      </div>
                      <h4 className="mt-1 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">{r.voyageTitle}</h4>
                      <dl className="mt-3 flex flex-col gap-1.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
                        <Row label="출발일" value={r.departDate} />
                        <Row label="객실" value={`${r.room}${r.roomNo ? ` (${r.roomNo}호)` : ""}`} />
                        <Row label="여권" value={r.passportExpiry ? "등록 완료" : "미등록"} />
                        <Row label="계약금" value={r.contractPaid ? "완료" : "대기"} />
                      </dl>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-4 py-3 text-[1.25em] outline-none focus:border-brand";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-navy">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}
