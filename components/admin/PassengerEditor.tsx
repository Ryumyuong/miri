"use client";

import { useState } from "react";
import type { Passenger, Reservation } from "@/lib/types";
import { updateReservation } from "@/lib/reservations";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// 날짜 입력을 YYYY-MM-DD 로 자동 포맷 (년도 뒤에도 대시)
function dateMask(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join("-");
}

type FieldType = "text" | "date" | "number" | "money" | "gender" | "room" | "secret";
type FieldDef = { key: keyof Passenger; label: string; type?: FieldType; upper?: boolean; maxLength?: number };

const ROOM_TYPES = ["내측", "오션뷰", "발코니", "스위트"];

const FIELDS: FieldDef[] = [
  { key: "nameKo", label: "한글이름" },
  { key: "lastNameEn", label: "영문 성", upper: true },
  { key: "firstNameEn", label: "영문 이름", upper: true },
  { key: "rrnFront", label: "주민번호 앞", maxLength: 6 },
  { key: "rrnBack", label: "주민번호 뒤", type: "secret", maxLength: 7 },
  { key: "gender", label: "성별", type: "gender" },
  { key: "roomType", label: "객실타입", type: "room" },
  { key: "rooming", label: "루밍(객실 배정)" },
  { key: "birth", label: "생년월일", type: "date" },
  { key: "passportNumber", label: "여권번호", upper: true },
  { key: "passportIssue", label: "여권 발급일", type: "date" },
  { key: "passportExpiry", label: "여권 만료일", type: "date" },
  { key: "phone", label: "고객연락처" },
  { key: "productPrice", label: "상품가", type: "money" },
  { key: "adjustAmount", label: "변동금액", type: "money" },
  { key: "note1", label: "비고1" },
  { key: "note2", label: "비고2" },
];

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
  const [list, setList] = useState<Passenger[]>(() =>
    reservation.passengers && reservation.passengers.length
      ? reservation.passengers.map((p) => ({ ...p }))
      : [
          {
            id: uid(),
            nameKo: reservation.name,
            phone: reservation.phone,
            roomType: reservation.room,
            passportNumber: reservation.passportNumber,
            passportExpiry: reservation.passportExpiry,
          },
        ],
  );
  const [saving, setSaving] = useState(false);

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
  const remove = (id: string) => setList((l) => l.filter((x) => x.id !== id));

  const save = async () => {
    setSaving(true);
    try {
      const clean = JSON.parse(JSON.stringify(list)) as Passenger[];
      if (onSave) await onSave(clean);
      else await updateReservation(reservation.id, { passengers: clean });
      onClose();
    } catch (e) {
      alert("저장 실패: " + (e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">승객(일행) 정보</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              예약코드 <span className="font-semibold text-[#1E4D8B]">{reservation.code ?? "-"}</span> · {reservation.voyageTitle}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* 승객 카드들 */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          {list.map((p, idx) => (
            <div key={p.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">
                  승객 {idx + 1}
                  {ageAtDepart(p.birth) != null && (
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      만 {ageAtDepart(p.birth)}세
                    </span>
                  )}
                </span>
                {list.length > 1 && (
                  <button onClick={() => remove(p.id)} className="text-xs font-semibold text-red-400 hover:text-red-500">
                    삭제
                  </button>
                )}
              </div>
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
                        onChange={(e) => patch(p.id, { roomType: e.target.value || undefined })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#1E4D8B] focus:bg-white"
                      >
                        <option value="">선택</option>
                        {ROOM_TYPES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    ) : f.type === "money" ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        value={won(p[f.key] as number | undefined)}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, "");
                          patch(p.id, { [f.key]: digits === "" ? undefined : Number(digits) });
                        }}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#1E4D8B] focus:bg-white"
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
                    ) : (
                      <input
                        type={f.type === "secret" ? "password" : "text"}
                        value={(p[f.key] as string) ?? ""}
                        onChange={(e) => patch(p.id, { [f.key]: f.upper ? e.target.value.toUpperCase() : e.target.value })}
                        placeholder={f.label}
                        maxLength={f.maxLength}
                        inputMode={f.maxLength ? "numeric" : undefined}
                        style={f.upper ? { textTransform: "uppercase" } : undefined}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#1E4D8B] focus:bg-white"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

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
