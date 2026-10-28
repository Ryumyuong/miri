"use client";

import { useEffect, useState } from "react";
import type { Passenger, Reservation } from "@/lib/types";
import { saveReservationPassengers } from "@/lib/reservations";
import { useVoyages } from "@/lib/useVoyages";
import SmartInput, { phoneMask, genderFromRrn } from "@/components/SmartInput";

import { membersOf, cancellationPatch } from "@/lib/reservation-state";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// 날짜 입력을 YYYY-MM-DD 로 자동 포맷 (년도 뒤에도 대시)
function dateMask(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join("-");
}

/**
 * 인원수 → 루밍(객실 배정) 선택지.
 *  짝수는 2명 1실 기준(4명 → A·B / 10명 → A~E), 홀수는 한 방이 더 필요하므로 +1 (3명 → A·B·C).
 *  Single / Multi 는 인원수와 무관하게 항상 포함.
 */
function roomingOptions(n: number): string[] {
  const rooms = n <= 0 ? 1 : n % 2 === 0 ? n / 2 : Math.ceil(n / 2) + 1;
  const letters = Array.from({ length: Math.min(Math.max(rooms, 1), 26) }, (_, i) => String.fromCharCode(65 + i));
  return [...letters, "Single", "Multi"];
}

type FieldType = "text" | "date" | "number" | "money" | "gender" | "room" | "secret" | "phone" | "rooming";
type FieldDef = {
  key: keyof Passenger;
  label: string;
  type?: FieldType;
  upper?: boolean;
  maxLength?: number;
  /** 한/영 자동 교정 — "en"이면 한글을 알파벳으로, "ko"면 알파벳을 한글로 되돌린다 */
  ime?: "ko" | "en";
};

const ROOM_TYPES = ["내측", "오션뷰", "발코니", "스위트"];

const FIELDS: FieldDef[] = [
  { key: "nameKo", label: "한글이름", ime: "ko" },
  { key: "lastNameEn", label: "영문 성", upper: true, ime: "en" },
  { key: "firstNameEn", label: "영문 이름", upper: true, ime: "en" },
  { key: "rrnFront", label: "주민번호 앞", maxLength: 6 },
  { key: "rrnBack", label: "주민번호 뒤", type: "secret", maxLength: 7 },
  { key: "gender", label: "성별", type: "gender" },
  { key: "roomType", label: "객실타입", type: "room" },
  { key: "rooming", label: "루밍(객실 배정)", type: "rooming" },
  { key: "birth", label: "생년월일", type: "date" },
  { key: "passportNumber", label: "여권번호", upper: true, ime: "en" },
  { key: "passportIssue", label: "여권 발급일", type: "date" },
  { key: "passportExpiry", label: "여권 만료일", type: "date" },
  { key: "phone", label: "고객연락처", type: "phone" },
  { key: "productPrice", label: "상품가", type: "money" },
  { key: "adjustAmount", label: "변동금액", type: "money" },
  { key: "note1", label: "비고1" },
  { key: "note2", label: "비고2" },
];

const INP = "w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#1E4D8B] focus:bg-white";

// 등록날짜 표시 — ISO(2026-08-19T07:12:30.000Z)·날짜만(2026-08-19) 두 형식이 섞여 있어 앞 10자만 쓴다
function fmtCreatedAt(v?: string): string {
  return v ? v.slice(0, 10) : "-";
}

export default function PassengerEditor({
  reservation,
  onClose,
  onSave,
  voyageDepartDate,
}: {
  reservation: Reservation;
  onClose: () => void;
  // 지정 시 저장을 이 콜백으로 위임(신규 생성 등). 없으면 기존 예약 업데이트.
  onSave?: (passengers: Passenger[]) => Promise<void>;
  // 나이·여권 경고 계산 기준일(운항일정의 현재 출발일). 없으면 예약 스냅샷 사용.
  voyageDepartDate?: string;
}) {
  const departRef = voyageDepartDate || reservation.departDate;
  // 아직 저장 전인 신규 승객 — 예약 문서가 없어 예약코드·등록날짜가 비어 있다
  const isNew = !reservation.id;
  const [list, setList] = useState<Passenger[]>(() =>
    membersOf(reservation).map(p => ({ ...p, id: p.id || uid() })),
  );
  const [saving, setSaving] = useState(false);
  const [countInput, setCountInput] = useState("1"); // 인원수 입력칸(문자열) — 아래 useEffect 로 목록 수와 동기화

  // 홈페이지에 등록된 이 상품의 요금 — 객실타입별 요금이 있으면 그걸, 없으면 최저가
  const { voyages } = useVoyages();
  const voyage = voyages.find((v) => v.id === reservation.voyageId);
  const priceFor = (roomType?: string): number | undefined => {
    if (!voyage) return undefined;
    const byRoom = roomType ? voyage.roomPrices?.[roomType] : undefined;
    return byRoom || voyage.priceFrom || undefined;
  };
  // 상품가가 비어 있으면 등록 요금으로 자동 채움 (이미 입력된 값은 건드리지 않음)
  useEffect(() => {
    if (!voyage) return;
    setList((l) =>
      l.map((p) => (p.productPrice == null ? { ...p, productPrice: priceFor(p.roomType) } : p)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voyage?.id, voyage?.priceFrom]);

  const activeCount = list.filter(p => p.status !== "cancelled").length;
  // 승객 수가 바뀌면(추가·삭제·인원수 입력) 입력칸도 따라간다
  useEffect(() => {
    setCountInput(String(activeCount));
  }, [activeCount]);

  // 출발일 기준 만나이
  const ageAtDepart = (birth?: string): number | null => {
    if (!birth || !departRef) return null;
    const b = new Date(birth + "T00:00:00");
    const d = new Date(departRef + "T00:00:00");
    if (isNaN(b.getTime()) || isNaN(d.getTime())) return null;
    let a = d.getFullYear() - b.getFullYear();
    const mm = d.getMonth() - b.getMonth();
    if (mm < 0 || (mm === 0 && d.getDate() < b.getDate())) a--;
    return a >= 0 ? a : null;
  };
  // 여권 만료일이 출발일 기준 6개월 미만이면 경고
  const passportExpiryWarn = (expiry?: string): boolean => {
    if (!expiry || !departRef) return false;
    const e = new Date(expiry + "T00:00:00");
    const t = new Date(departRef + "T00:00:00");
    if (isNaN(e.getTime()) || isNaN(t.getTime())) return false;
    t.setMonth(t.getMonth() + 6);
    return e.getTime() < t.getTime();
  };
  // 금액 콤마 표기
  const won = (n?: number) => (n || n === 0 ? Number(n).toLocaleString("ko-KR") : "");

  const patch = (id: string, p: Partial<Passenger>) =>
    setList((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const add = () => setList((l) => [...l, { id: uid(), roomType: reservation.room }]);
  const remove = (id: string) => setList(l => l.map(p => p.id === id ? { ...p, ...cancellationPatch(p, p.status !== "cancelled", new Date().toISOString()) } : p));

  // 인원수 입력 → 그 수만큼 승객 카드를 자동으로 맞춘다 (줄일 때 입력된 내용이 있으면 확인)
  const commitCount = () => {
    const n = Number(countInput);
    if (!n) {
      setCountInput(String(list.length)); // 비우고 나가면 원래대로
      return;
    }
    setCount(n);
  };
  const setCount = (n: number) => {
    const next = Math.max(1, Math.min(50, Math.floor(n) || 1));
    setList((l) => {
      const active = l.filter(p => p.status !== "cancelled");
      if (next === active.length) return l;
      if (next > active.length) {
        const add = Array.from({ length: next - active.length }, () => ({
          id: uid(),
          roomType: reservation.room,
          productPrice: priceFor(reservation.room),
        }));
        return [...l, ...add];
      }
      const cut = active.slice(next);
      const filled = cut.some((p) => p.nameKo || p.lastNameEn || p.firstNameEn || p.rrnFront || p.passportNumber);
      if (filled && !confirm(`${cut.length}명을 줄이면 취소 상태로 보존됩니다.\n계속할까요?`)) return l;
      return l.map(p => cut.includes(p) ? { ...p, ...cancellationPatch(p, true, new Date().toISOString()) } : p);
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const clean = JSON.parse(JSON.stringify(list)) as Passenger[];
      if (onSave) await onSave(clean);
      else await saveReservationPassengers(reservation, clean);
      onClose();
    } catch (e) {
      alert("저장하지 못했습니다." + (e instanceof Error && e.message ? "\n\n" + e.message : " 잠시 후 다시 시도해 주세요."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <details className="px-6 pt-3 text-xs text-slate-500"><summary>팀 취소·복구 이력</summary>{(reservation.cancellationHistory ?? []).map((e, i) => <p key={i}>{e.action === "cancel" ? "취소" : "복구"} · {new Date(e.at).toLocaleString("ko-KR")}</p>)}</details>
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              승객(일행) 정보
              {isNew && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">신규 등록</span>}
              {/* 등록 경로 — 표시가 없으면 기능 도입 전 데이터라 구분 불가 */}
              {reservation.source === "admin" && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">관리자 등록</span>}
              {reservation.source === "web" && <span className="ml-2 rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-700">홈페이지 예약</span>}
            </h2>
            {/* 신규는 아직 문서가 없어 예약코드·등록날짜가 없다 — 저장 시 자동 발급됨을 알려준다 */}
            <p className="mt-0.5 text-xs text-slate-400">
              예약코드{" "}
              <span className={isNew ? "font-semibold text-slate-400" : "font-semibold text-[#1E4D8B]"}>
                {isNew ? "저장 시 자동 발급" : reservation.code ?? "-"}
              </span>
              {reservation.voyageTitle && <> · {reservation.voyageTitle}</>}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              등록날짜{" "}
              <span className="font-semibold text-slate-600">
                {isNew ? "저장 시 자동 기록" : fmtCreatedAt(reservation.createdAt)}
              </span>
              {reservation.departDate && <> · 출발일 <span className="font-semibold text-slate-600">{reservation.departDate}</span></>}
            </p>
            {(reservation.voyageChangeHistory ?? []).map((e, i) => (
              <p key={i} className="mt-0.5 text-xs text-slate-400">
                일정변경 {e.fromDepartDate} → <span className="font-semibold text-slate-600">{e.toDepartDate}</span>
                {e.toVoyageTitle && e.fromVoyageId !== e.toVoyageId && e.fromVoyageTitle !== e.toVoyageTitle && <> ({e.toVoyageTitle})</>}
                {" "}· {new Date(e.at).toLocaleString("ko-KR")}
              </p>
            ))}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* 승객 카드들 */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          {list.map((p, idx) => (
            <div key={p.id} className={`rounded-xl border border-slate-200 p-4 ${p.status === "cancelled" ? "bg-red-50" : ""}`}>
                {p.status === "cancelled" && <p className="mb-2 text-xs text-red-600">취소일시: {p.cancelledAt ? new Date(p.cancelledAt).toLocaleString("ko-KR") : "기록 없음"} · 저장 시 반영</p>}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">
                  승객 {idx + 1}
                  {ageAtDepart(p.birth) != null && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      만 {ageAtDepart(p.birth)}세
                    </span>
                  )}
                </span>
                {(
                  <button onClick={() => remove(p.id)} className="text-xs font-semibold text-red-400 hover:text-red-500">
                    {p.status === "cancelled" ? "복구" : "취소"}
                  </button>
                )}
              </div>
              <details className="mb-2 text-xs text-slate-500"><summary>취소·복구 이력</summary>{(p.cancellationHistory ?? []).map((e, i) => <p key={i}>{e.action === "cancel" ? "취소" : "복구"} · {new Date(e.at).toLocaleString("ko-KR")}</p>)}</details>
              <div className="grid grid-cols-4 gap-x-3 gap-y-3 max-[501px]:grid-cols-2">
                {FIELDS.map((f) => (
                  <div key={String(f.key)}>
                    <label className="mb-1 block text-[11px] font-medium text-slate-400">{f.label}</label>
                    {f.type === "gender" ? (
                      <select
                        value={(p[f.key] as string) ?? ""}
                        onChange={(e) => patch(p.id, { gender: e.target.value as Passenger["gender"] })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#1E4D8B] focus:bg-white"
                      >
                        <option value="">선택</option>
                        <option value="남">남</option>
                        <option value="여">여</option>
                      </select>
                    ) : f.type === "room" ? (
                      <select
                        value={(p[f.key] as string) ?? ""}
                        onChange={(e) => {
                          const next = e.target.value || undefined;
                          // 객실타입이 바뀌면 상품가도 그 타입의 등록 요금으로.
                          // 단 관리자가 직접 고쳐둔 값(= 이전 타입 요금과 다른 값)은 그대로 둔다.
                          const untouched = p.productPrice == null || p.productPrice === priceFor(p.roomType);
                          patch(p.id, {
                            roomType: next,
                            ...(untouched ? { productPrice: priceFor(next) } : {}),
                          });
                        }}
                        className={INP}
                      >
                        <option value="">선택</option>
                        {ROOM_TYPES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : f.type === "money" ? (
                      (() => {
                        const ref = f.key === "productPrice" ? priceFor(p.roomType) : undefined;
                        const differs = ref != null && p.productPrice !== ref;
                        return (
                          <>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={won(p[f.key] as number | undefined)}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/[^\d]/g, "");
                                patch(p.id, { [f.key]: digits === "" ? undefined : Number(digits) });
                              }}
                              placeholder="0"
                              className={INP}
                            />
                            {differs && (
                              <button
                                type="button"
                                onClick={() => patch(p.id, { productPrice: ref })}
                                className="mt-1 block text-left text-[10px] font-semibold text-[#1E4D8B] underline decoration-dotted"
                              >
                                등록 요금 {won(ref)}원 적용
                              </button>
                            )}
                          </>
                        );
                      })()
                    ) : f.type === "rooming" ? (
                      (() => {
                        const opts = roomingOptions(activeCount);
                        const val = (p.rooming as string) ?? "";
                        return (
                          <select
                            value={val}
                            onChange={(e) => patch(p.id, { rooming: e.target.value || undefined })}
                            className={INP}
                          >
                            <option value="">선택</option>
                            {/* 예전에 직접 적어둔 값이 목록에 없으면 그대로 보존 */}
                            {val && !opts.includes(val) && <option value={val}>{val} (기존값)</option>}
                            {opts.map((o) => (
                              <option key={o} value={o}>{o}</option>
                            ))}
                          </select>
                        );
                      })()
                    ) : f.type === "phone" ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={(p[f.key] as string) ?? ""}
                        onChange={(e) => patch(p.id, { [f.key]: phoneMask(e.target.value) })}
                        placeholder="010-0000-0000"
                        maxLength={13}
                        className={INP}
                      />
                    ) : f.type === "date" ? (
                      (() => {
                        const warn = f.key === "passportExpiry" && passportExpiryWarn(p.passportExpiry);
                        return (
                          <>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={(p[f.key] as string) ?? ""}
                              onChange={(e) => patch(p.id, { [f.key]: dateMask(e.target.value) })}
                              placeholder="YYYY-MM-DD"
                              maxLength={10}
                              className={`w-full rounded-lg border bg-slate-50 px-2.5 py-2 text-sm outline-none focus:bg-white ${
                                warn ? "border-red-400 font-semibold text-red-500 focus:border-red-500" : "border-slate-200 text-slate-700 focus:border-[#1E4D8B]"
                              }`}
                            />
                            {warn && (
                              <p className="mt-1 text-[10px] font-semibold text-red-500">⚠ 출발일 기준 여권 만료 6개월 미만</p>
                            )}
                          </>
                        );
                      })()
                    ) : f.key === "rrnBack" ? (
                      <input
                        type="password"
                        value={p.rrnBack ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          const g = genderFromRrn(v);
                          // 뒷자리 첫 숫자로 성별 자동 지정 (1·3·5·7·9 남 / 2·4·6·8·0 여)
                          patch(p.id, { rrnBack: v, ...(g ? { gender: g } : {}) });
                        }}
                        placeholder={f.label}
                        maxLength={7}
                        inputMode="numeric"
                        className={INP}
                      />
                    ) : (
                      <SmartInput
                        type={f.type === "secret" ? "password" : "text"}
                        value={(p[f.key] as string) ?? ""}
                        onChange={(v) => patch(p.id, { [f.key]: v })}
                        ime={f.ime}
                        upper={f.upper}
                        placeholder={f.label}
                        maxLength={f.maxLength}
                        inputMode={f.maxLength ? "numeric" : undefined}
                        style={f.upper ? { textTransform: "uppercase" } : undefined}
                        className={INP}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 인원수 — 숫자만 바꾸면 승객 카드가 그만큼 자동으로 생기고 줄어든다 */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-sm font-bold text-slate-700">인원수</span>
            {/* 입력 중에는 문자열로 두고(지웠다 다시 칠 수 있게) 다 치면 반영 */}
            <input
              type="text"
              inputMode="numeric"
              value={countInput}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setCountInput(e.target.value.replace(/\D/g, "").slice(0, 2))}
              onBlur={() => commitCount()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitCount();
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-center text-sm font-semibold text-slate-700 outline-none focus:border-[#1E4D8B]"
            />
            <span className="text-sm text-slate-500">명</span>
            <span className="ml-auto text-xs text-slate-400">
              루밍 선택지 <b className="text-slate-500">{roomingOptions(activeCount).join(" · ")}</b>
            </span>
          </div>

          <button
            onClick={add}
            className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 hover:border-[#1E4D8B] hover:text-[#1E4D8B]"
          >
            + 일행 추가
          </button>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">
            취소
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-[#1E4D8B] px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
