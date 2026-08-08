"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import SpecialTerms from "@/components/site/SpecialTerms";
import { useVoyages } from "@/lib/useVoyages";
import { addReservation, sendReservationContract } from "@/lib/reservations";
import { getMember, saveMemberPassport } from "@/lib/members";
import type { Passenger } from "@/lib/types";

const STEPS = ["상품 확인", "객실/인원 선택", "예약자 정보", "동반자 정보", "약관 동의", "신청 완료"];

const ROOMS = [
  { type: "내측", label: "내측 객실", mult: 1 },
  { type: "오션뷰", label: "오션뷰", mult: 1.103 },
  { type: "발코니", label: "발코니", mult: 1.334 },
  { type: "스위트", label: "스위트", mult: 2.288 },
];

const TERMS = [
  { key: "travel", title: "여행약관 동의 (필수)", desc: "여행 예약 및 취소 환불 규정에 동의합니다", required: true },
  { key: "privacy", title: "개인정보 수집 및 이용 동의 (필수)", desc: "예약 및 여행 서비스 제공을 위한 개인정보 수집에 동의합니다", required: true },
  { key: "marketing", title: "마케팅 수신 동의 (선택)", desc: "여행 상품 및 이벤트 정보 수신에 동의합니다", required: false },
];

type DetailField = { key: string; label: string; type?: "date" | "password" | "gender"; upper?: boolean; maxLength?: number };
const TRAVELER_FIELDS: DetailField[] = [
  { key: "nameKo", label: "한글이름" },
  { key: "lastNameEn", label: "영문 성", upper: true },
  { key: "firstNameEn", label: "영문 이름", upper: true },
  { key: "rrnFront", label: "주민번호 앞", maxLength: 6 },
  { key: "rrnBack", label: "주민번호 뒤", type: "password", maxLength: 7 },
  { key: "gender", label: "성별", type: "gender" },
  { key: "birth", label: "생년월일", type: "date" },
  { key: "passportNumber", label: "여권번호", upper: true },
  { key: "passportIssue", label: "여권 발급일", type: "date" },
  { key: "passportExpiry", label: "여권 만료일", type: "date" },
];

const won = (n: number) => "₩" + n.toLocaleString("ko-KR");
const roomPrice = (base: number, mult: number) => Math.round((base * mult) / 10000) * 10000;
/** 전화번호를 010-0000-0000 형식으로 정규화 (숫자만 추출 후 하이픈 삽입) */
const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
};
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const genCode = () =>
  "MC" + String(new Date().getFullYear()).slice(2) + "-" + Math.random().toString(36).slice(2, 7).toUpperCase();

export default function ReservePage() {
  const params = useParams();
  const id = String(params.id);
  const sp = useSearchParams();
  const { voyages, loading } = useVoyages();
  const v = voyages.find((x) => x.id === id);

  const [step, setStep] = useState(0);
  const [room, setRoom] = useState("내측");
  const [adult, setAdult] = useState(Number(sp.get("adult")) || 2);
  const [child, setChild] = useState(Number(sp.get("child")) || 0);
  const count = Math.max(1, adult + child);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  // 여행자(본인+동반자) 상세 — 본인은 여행자 1
  const [travelers, setTravelers] = useState<Array<Record<string, string>>>([]);
  const setTraveler = (i: number, k: string, val: string) =>
    setTravelers((l) => l.map((x, idx) => (idx === i ? { ...x, [k]: val } : x)));
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [resultCode, setResultCode] = useState("");

  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    const mid = localStorage.getItem("miri-user-id");
    if (!mid) return;
    setMemberId(mid);
    getMember(mid).then((m) => {
      if (!m) return;
      if (m.name) setName(m.name);
      if (m.phone) setPhone(m.phone);
    });
  }, []);

  // 여행자 입력칸 개수 = 인원수
  useEffect(() => {
    setTravelers((prev) => {
      if (prev.length === count) return prev;
      const next = prev.slice(0, count);
      while (next.length < count) next.push({});
      return next;
    });
  }, [count]);

  const base = v?.priceFrom ?? 0;
  // 객실별 직접 지정 요금(관리자 입력)이 있으면 우선, 없으면 상품가×배수 자동계산
  const roomPriceFor = (r: { type: string; mult: number }) => v?.roomPrices?.[r.type] ?? roomPrice(base, r.mult);
  const price = roomPriceFor(ROOMS.find((r) => r.type === room) ?? ROOMS[0]);
  const childPrice = Math.round(price * 0.75); // 아동(소아)은 성인가의 75% (상세페이지와 동일)
  const total = adult * price + child * childPrice;

  // ── 예약자 정보 유효성 검사 (이름 · 연락처 · 이메일) ──
  const validateContact = (): boolean => {
    const nm = name.trim();
    const ph = phone.replace(/[\s-]/g, "");
    if (nm.length < 2) {
      alert("이름을 정확히 입력해 주세요.");
      return false;
    }
    if (!/^01[0-9]\d{7,8}$/.test(ph)) {
      alert("연락처를 정확히 입력해 주세요. (예: 010-1234-5678)");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert("이메일 형식이 올바르지 않습니다. (예: name@example.com)");
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!v) return;
    if (!validateContact()) { setStep(2); return; }
    const phoneFmt = formatPhone(phone); // 010-0000-0000 형식으로 저장
    setSaving(true);
    try {
      const code = genCode();
      const mk = (r: Record<string, string>, seed: Partial<Passenger>): Passenger => ({
        id: uid(),
        roomType: room,
        productPrice: price, // 선택 객실 기준 1인 상품가 (관리자 명단·CSV 연동)
        ...seed,
        ...Object.fromEntries(Object.entries(r).filter(([, val]) => val)),
      }) as Passenger;
      const passengers = travelers.map((t, i) => {
        const pp = i < adult ? price : childPrice; // 앞 성인 인원 = 성인가, 이후 = 아동가(75%)
        return i === 0
          ? mk({ ...t, nameKo: t.nameKo || name }, { phone: phoneFmt, roomType: room, productPrice: pp })
          : mk(t, { roomType: room, productPrice: pp });
      });
      const resvId = await addReservation({
        voyageId: v.id,
        voyageTitle: v.title,
        departDate: v.departDate,
        arriveDate: v.arriveDate,
        name,
        phone: phoneFmt,
        email: email || undefined,
        room,
        headcount: count,
        passengers,
        passportNumber: travelers[0]?.passportNumber || undefined,
        passportExpiry: travelers[0]?.passportExpiry || undefined,
        contractPaid: false,
        code,
      });
      // 예약 후 여행자계약서 자동 발송 (상품코드/예약코드 포함) + 발송됨 표기
      try {
        await sendReservationContract({ id: resvId, name, phone: phoneFmt, voyageTitle: v.title, code });
      } catch {
        /* 발송 실패해도 예약은 완료 처리 */
      }
      if (memberId && travelers[0]?.passportNumber) {
        await saveMemberPassport(memberId, {
          passportNumber: travelers[0].passportNumber || undefined,
          passportExpiry: travelers[0].passportExpiry || undefined,
        });
      }
      setResultCode(code);
      setStep(5);
    } catch (err) {
      alert("신청 실패: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 2) return !!name && !!phone && !!email;
    if (step === 4) return TERMS.filter((t) => t.required).every((t) => agree[t.key]);
    return true;
  };
  const next = () => {
    if (step === 2 && !validateContact()) return;
    if (step === 4) return submit();
    setStep((s) => Math.min(5, s + 1));
  };
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F4F7]">
      <SiteHeader solid />
      <main className="flex-1 pt-44 pb-44 max-[991px]:pt-28 max-[991px]:pb-24" style={{ fontSize: "var(--font-base)" }}>
        <div className="mx-auto w-full max-w-[64em] px-5">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-[min(2.1323vw,40.9402px)] max-[991px]:text-[min(6.6414vw,39.8484px)] max-[501px]:text-[8.0656vw] font-extrabold text-[#0B2A4A]">가예약 신청</h1>
            <Link href={`/cruises/${id}`} className="text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-medium text-[#1E4D8B] hover:underline">
              ← 상품 상세로 돌아가기
            </Link>
          </div>

          {!v ? (
            <div className="rounded-[16px] border border-[#0B2A4A1a] bg-white p-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
              {loading ? "불러오는 중…" : "상품을 찾을 수 없습니다."}
            </div>
          ) : (
            <div className="rounded-[16px] border border-[#0B2A4A1a] bg-white px-[2em] py-[3em] max-[991px]:px-[1em] max-[991px]:py-[1.5em]">
              {/* 스텝 인디케이터 */}
              <div className="mb-[2.6em] flex items-start justify-between">
                {STEPS.map((label, i) => {
                  const done = i < step;
                  const active = i === step;
                  return (
                    <div key={label} className="flex flex-1 flex-col items-center gap-[0.7em]">
                      <span
                        className={`grid h-[2.6em] w-[2.6em] place-items-center rounded-full text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-medium ${
                          done || active
                            ? "bg-[#1E4D8B] text-white shadow-[0px_0px_0px_4px_#1E4D8B33]"
                            : "border-2 border-[#0B2A4A1a] bg-transparent text-[#5A6B7E]"
                        }`}
                      >
                        {done ? <Check className="h-[1.2em] w-[1.2em]" /> : i + 1}
                      </span>
                      <span className={`text-center text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] ${active ? "font-medium text-[#0B2A4A]" : "text-[#5A6B7E]"}`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="min-h-[18em]">
                {step === 0 && (
                  <Section title="상품 정보 확인">
                    <div className="rounded-[12px] bg-[#F2F4F7] p-[1.8em]">
                      <p className="text-[min(1.0661vw,20.4691px)] max-[991px]:text-[min(3.3207vw,19.9242px)] max-[501px]:text-[4.0328vw] font-medium text-[#0B2A4A]">{v.region}</p>
                      <div className="mt-[1.2em] grid grid-cols-2 gap-y-[1.2em]">
                        <Info label="선박" value={v.shipName} />
                        <Info label="출발일" value={v.departDate} />
                        <Info label="기간" value={`${v.nights}박 ${v.days}일`} />
                        <Info label="가격" value={`${won(price)} / 1인`} />
                      </div>
                    </div>
                  </Section>
                )}

                {step === 1 && (
                  <Section title="객실 및 인원 선택">
                    <p className="mb-[0.7em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">객실 타입</p>
                    <div className="grid grid-cols-2 gap-[1em]">
                      {ROOMS.map((r) => {
                        const sel = room === r.type;
                        return (
                          <button
                            key={r.type}
                            onClick={() => setRoom(r.type)}
                            className={`rounded-[10px] px-4 py-[1.4em] text-center transition ${
                              sel ? "border-2 border-[#1E4D8B] bg-[#1E4D8B]/5" : "border border-[#0B2A4A1a] bg-white hover:border-slate-300"
                            }`}
                          >
                            <p className="text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-medium text-[#0B2A4A]">{r.label}</p>
                            <p className="mt-[0.3em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">{won(roomPriceFor(r))}</p>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-[1.6em] grid grid-cols-2 gap-[1.4em]">
                      <NumField label="성인" value={adult} set={(n) => setAdult(Math.max(1, n))} min={1} />
                      <NumField label="소아" value={child} set={(n) => setChild(Math.max(0, n))} min={0} />
                    </div>
                    {base > 0 && (
                      <div className="mt-[1.6em] rounded-[10px] bg-[#F2F4F7] p-[1.4em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw]">
                        <div className="flex justify-between text-[#5A6B7E]">
                          <span>성인 {adult}명 × {won(price)}</span>
                          <span>{won(adult * price)}</span>
                        </div>
                        {child > 0 && (
                          <div className="mt-[0.5em] flex justify-between text-[#5A6B7E]">
                            <span>소아 {child}명 × {won(childPrice)} <span className="text-[0.9em] text-slate-400">(성인가 75%)</span></span>
                            <span>{won(child * childPrice)}</span>
                          </div>
                        )}
                        <div className="mt-[0.8em] flex justify-between border-t border-slate-200 pt-[0.8em] text-[1.2em] font-bold text-[#0B2A4A]">
                          <span>합계</span>
                          <span>{won(total)}</span>
                        </div>
                      </div>
                    )}
                  </Section>
                )}

                {step === 2 && (
                  <Section title="예약자 정보">
                    <div className="flex flex-col gap-[1.4em]">
                      <Field label="이름" required>
                        <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
                      </Field>
                      <Field label="연락처" required>
                        <input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
                      </Field>
                      <Field label="이메일" required>
                        <input className={inp} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                      </Field>
                    </div>
                  </Section>
                )}

                {step === 3 && (
                  <Section title="동반자 정보">
                    <p className="mb-[1.2em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">여권 정보는 출발 전까지 제출 가능합니다</p>
                    <div className="flex flex-col gap-[1em]">
                      {travelers.map((t, i) => (
                        <div key={i} className="rounded-[10px] border border-[#0B2A4A1a] bg-[#F2F4F7] p-[1.4em]">
                          <p className="mb-[0.8em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-medium text-[#0B2A4A]">
                            여행자 {i + 1}
                            {i === 0 && <span className="ml-[0.5em] text-[#5A6B7E]">(예약자)</span>}
                          </p>
                          <DetailGrid
                            fields={TRAVELER_FIELDS}
                            value={i === 0 ? { nameKo: name, ...t } : t}
                            onField={(k, val) => setTraveler(i, k, val)}
                          />
                        </div>
                      ))}
                    </div>
                  </Section>
                )}

                {step === 4 && (
                  <Section title="약관 동의">
                    <div className="mb-[1.2em] text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw]">
                      <SpecialTerms departDate={v.departDate} />
                    </div>
                    <div className="flex flex-col gap-[0.8em]">
                      {TERMS.map((t) => (
                        <label key={t.key} className="flex cursor-pointer items-start gap-[0.8em] rounded-[10px] border border-[#0B2A4A1a] bg-white px-[1.2em] py-[1em]">
                          <input type="checkbox" checked={!!agree[t.key]} onChange={(e) => setAgree((a) => ({ ...a, [t.key]: e.target.checked }))} className="mt-[0.2em] h-[1.2em] w-[1.2em] accent-[#1E4D8B]" />
                          <span>
                            <span className="block text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-medium text-[#0B2A4A]">{t.title}</span>
                            <span className="mt-[0.2em] block text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">{t.desc}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </Section>
                )}

                {step === 5 && (
                  <div className="py-[2em] text-center">
                    <span className="mx-auto grid h-[5em] w-[5em] place-items-center rounded-full bg-emerald-100 text-emerald-600">
                      <Check className="h-[2.2em] w-[2.2em]" />
                    </span>
                    <h2 className="mt-[1em] text-[min(1.4216vw,27.2947px)] max-[991px]:text-[min(4.4277vw,26.5662px)] max-[501px]:text-[5.3772vw] font-bold text-[#0B2A4A]">가예약이 신청되었습니다</h2>
                    <p className="mt-[0.6em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] leading-[1.7] text-[#5A6B7E]">
                      출발 확정 후 담당자가 연락드릴 예정입니다.
                      <br />
                      여권 정보는 출발 전까지 제출 가능합니다.
                    </p>
                    <div className="mx-auto mt-[1.6em] flex max-w-[26em] flex-col gap-[0.8em] rounded-[12px] bg-[#F2F4F7] p-[1.4em]">
                      <div className="flex items-center justify-between">
                        <span className="text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">예약번호</span>
                        <span className="text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-bold text-[#0B2A4A]">{resultCode}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">상태</span>
                        <span className="rounded-full bg-[#1E4D8B]/10 px-[0.8em] py-[0.2em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-semibold text-[#1E4D8B]">가예약</span>
                      </div>
                    </div>
                    <Link href="/reservation" className="mt-[1.6em] inline-block rounded-[8px] bg-[#1E4D8B] px-[1.8em] py-[0.8em] text-[min(0.9477vw,18.1958px)] max-[991px]:text-[min(2.9518vw,17.7108px)] max-[501px]:text-[3.5848vw] font-bold text-white hover:brightness-110">
                      예약 내역 확인
                    </Link>
                  </div>
                )}
              </div>

              {step < 5 && (
                <>
                  <div className="my-[1.6em] h-px w-full bg-[#0B2A4A1a]" />
                  <div className="flex items-center justify-between">
                    <button onClick={prev} disabled={step === 0} className="rounded-[8px] border border-[#0B2A4A1a] bg-transparent px-[1.4em] py-[0.7em] text-[min(0.9477vw,18.1958px)] max-[991px]:text-[min(2.9518vw,17.7108px)] max-[501px]:text-[3.5848vw] font-bold text-[#0B2A4A] transition hover:bg-slate-50 disabled:opacity-40">
                      ← 이전
                    </button>
                    <button onClick={next} disabled={!canNext() || saving} className="rounded-[8px] bg-[#1E4D8B] px-[1.6em] py-[0.7em] text-[min(0.9477vw,18.1958px)] max-[991px]:text-[min(2.9518vw,17.7108px)] max-[501px]:text-[3.5848vw] font-bold text-white transition hover:brightness-110 disabled:opacity-40">
                      {step === 4 ? (saving ? "신청 중…" : "가예약 신청 →") : "다음 →"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

const inp = "w-full rounded-[8px] border border-[#0B2A4A1a] bg-white px-3 py-[0.7em] text-[1.0769em] text-[#0B2A4A] outline-none focus:border-[#1E4D8B]";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-[1.2em] text-[min(1.4216vw,27.2947px)] max-[991px]:text-[min(4.4277vw,26.5662px)] max-[501px]:text-[5.3772vw] font-medium text-[#0B2A4A]">{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">{label}</p>
      <p className="mt-[0.2em] text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] font-medium text-[#0B2A4A]">{value || "—"}</p>
    </div>
  );
}

function NumField({ label, value, set, min }: { label: string; value: number; set: (n: number) => void; min: number }) {
  return (
    <div>
      <label className="mb-[0.5em] block text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">{label}</label>
      <input type="number" min={min} className={inp} value={value} onChange={(e) => set(+e.target.value || min)} />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-[0.5em] block text-[min(0.8292vw,15.9206px)] max-[991px]:text-[min(2.5827vw,15.4962px)] max-[501px]:text-[3.1366vw] text-[#5A6B7E]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// 날짜 입력을 YYYY-MM-DD 로 자동 포맷 (년도 뒤에도 대시)
function dateMask(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join("-");
}

function DetailGrid({ fields, value, onField }: { fields: DetailField[]; value: Record<string, string>; onField: (k: string, v: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-[0.8em] max-[501px]:grid-cols-1">
      {fields.map((f) => (
        <Field key={f.key} label={f.label}>
          {f.type === "gender" ? (
            <select className={inp} value={value[f.key] ?? ""} onChange={(e) => onField(f.key, e.target.value)}>
              <option value="">선택</option>
              <option value="남">남</option>
              <option value="여">여</option>
            </select>
          ) : f.type === "date" ? (
            <input
              type="text"
              inputMode="numeric"
              className={inp}
              value={value[f.key] ?? ""}
              onChange={(e) => onField(f.key, dateMask(e.target.value))}
              placeholder="YYYY-MM-DD"
              maxLength={10}
            />
          ) : (
            <input
              type={f.type === "password" ? "password" : "text"}
              className={inp}
              style={f.upper ? { textTransform: "uppercase" } : undefined}
              maxLength={f.maxLength}
              inputMode={f.maxLength ? "numeric" : undefined}
              value={value[f.key] ?? ""}
              onChange={(e) => onField(f.key, f.upper ? e.target.value.toUpperCase() : e.target.value)}
              placeholder={f.label}
            />
          )}
        </Field>
      ))}
    </div>
  );
}
