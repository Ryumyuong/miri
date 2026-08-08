"use client";

import { useEffect, useState } from "react";
import type { Voyage } from "@/lib/types";
import { addReservation } from "@/lib/reservations";
import type { Passenger } from "@/lib/types";
import { getMember, saveMemberPassport } from "@/lib/members";
import { uploadImage } from "@/lib/upload";

const ROOMS = ["내측", "오션뷰", "발코니", "스위트"];

export default function ReservationForm({
  voyage,
  departDate,
  arriveDate,
  headcount,
  onClose,
}: {
  voyage: Voyage;
  departDate: string;
  arriveDate: string;
  headcount: number;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [room, setRoom] = useState(ROOMS[0]);
  const [count, setCount] = useState(headcount || 1);
  // 동반 승객(신청자 외 일행) 상세 — 인원수-1 만큼
  const [pax, setPax] = useState<Array<Record<string, string>>>([]);
  const setPaxField = (i: number, key: string, value: string) =>
    setPax((l) => l.map((x, idx) => (idx === i ? { ...x, [key]: value } : x)));
  // 신청자 추가 정보 (영문이름·주민번호·성별·생년월일·여권발급일)
  const [repExtra, setRepExtra] = useState<Record<string, string>>({});
  const setRep = (key: string, value: string) => setRepExtra((r) => ({ ...r, [key]: value }));
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [passportImage, setPassportImage] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // 로그인 회원: 계정에 저장된 정보 자동 입력 + 여권 정보 계정 저장 옵션
  const [memberId, setMemberId] = useState<string | null>(null);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("miri-user-id");
    if (!id) return;
    setMemberId(id);
    getMember(id).then((m) => {
      if (!m) return;
      if (m.name) setName(m.name);
      if (m.phone) setPhone(m.phone);
      if (m.passportNumber) setPassportNumber(m.passportNumber);
      if (m.passportExpiry) setPassportExpiry(m.passportExpiry);
      if (m.passportImage) setPassportImage(m.passportImage);
      if (m.passportNumber || m.passportExpiry || m.passportImage) setPrefilled(true);
    });
  }, []);

  // 인원수 변경 시 동반 승객 입력칸 개수 동기화 (신청자 제외 = count-1)
  useEffect(() => {
    setPax((prev) => {
      const need = Math.max(0, count - 1);
      if (prev.length === need) return prev;
      const next = prev.slice(0, need);
      while (next.length < need) next.push({});
      return next;
    });
  }, [count]);

  const onPickPassport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setUploading(true);
    try {
      setPassportImage(await uploadImage(file, "passports"));
    } catch (err) {
      alert("여권 스캔 업로드 실패: " + (err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    setSaving(true);
    try {
      // 인원수만큼 승객(일행) 슬롯을 미리 생성 — 대표자(1번)는 입력값으로 채우고,
      // 나머지는 빈 슬롯으로 두어 관리자 편집기에서 바로 채울 수 있게 한다.
      const uid = () =>
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);
      const mk = (r: Record<string, string>, seed: Partial<Passenger>): Passenger => ({
        id: uid(),
        roomType: room,
        ...seed,
        ...(r.nameKo ? { nameKo: r.nameKo } : {}),
        ...(r.lastNameEn ? { lastNameEn: r.lastNameEn } : {}),
        ...(r.firstNameEn ? { firstNameEn: r.firstNameEn } : {}),
        ...(r.rrnFront ? { rrnFront: r.rrnFront } : {}),
        ...(r.rrnBack ? { rrnBack: r.rrnBack } : {}),
        ...(r.gender ? { gender: r.gender as Passenger["gender"] } : {}),
        ...(r.birth ? { birth: r.birth } : {}),
        ...(r.passportNumber ? { passportNumber: r.passportNumber } : {}),
        ...(r.passportIssue ? { passportIssue: r.passportIssue } : {}),
        ...(r.passportExpiry ? { passportExpiry: r.passportExpiry } : {}),
      });
      const passengers = Array.from({ length: Math.max(1, count) }, (_, i) =>
        i === 0
          ? mk(repExtra, {
              nameKo: name,
              phone,
              roomType: room,
              passportNumber: passportNumber || undefined,
              passportExpiry: passportExpiry || undefined,
            })
          : mk(pax[i - 1] ?? {}, { roomType: room }),
      );
      await addReservation({
        voyageId: voyage.id,
        voyageTitle: voyage.title,
        departDate,
        arriveDate,
        name,
        phone,
        room,
        headcount: count,
        passengers,
        passportNumber: passportNumber || undefined,
        passportExpiry: passportExpiry || undefined,
        passportImage,
        contractPaid: false,
      });
      // 로그인 회원이면 여권 정보를 계정에 저장 (다음 신청 시 자동 입력)
      if (memberId && saveToAccount && (passportNumber || passportExpiry || passportImage)) {
        await saveMemberPassport(memberId, {
          passportNumber: passportNumber || undefined,
          passportExpiry: passportExpiry || undefined,
          passportImage,
        });
      }
      setDone(true);
    } catch (err) {
      alert("신청 실패: " + (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" style={{ fontSize: "var(--font-base)" }}>
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white px-6 pt-6 pb-0 shadow-xl">
        {done ? (
          <div className="py-8 text-center">
            <p className="text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw]">✅</p>
            <h2 className="mt-3 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">가예약 신청이 접수되었습니다</h2>
            <p className="mt-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">
              담당 상담원이 확인 후 연락드립니다.
              {!passportExpiry && " 여권 정보는 출발 전까지 등록해 주세요."}
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-navy px-6 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-1 flex items-start justify-between gap-3">
              <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">가예약 신청</h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <p className="mb-5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{voyage.title}</p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="신청자 이름" required>
                <input className={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required />
              </Field>
              <Field label="연락처" required>
                <input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" required />
              </Field>
              <Field label="객실 타입">
                <select className={inp} value={room} onChange={(e) => setRoom(e.target.value)}>
                  {ROOMS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="인원">
                <input type="number" min={1} className={inp} value={count} onChange={(e) => setCount(Math.max(1, +e.target.value))} />
              </Field>
            </div>

            {/* ── 신청자 상세 정보 ── */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-navy">신청자 상세 정보 <span className="text-[0.85em] font-medium text-slate-400">(선택)</span></p>
              <p className="mt-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">영문이름·주민번호·성별·생년월일·여권 발급일</p>
              <div className="mt-3">
                <DetailGrid fields={REP_FIELDS} value={repExtra} onField={setRep} />
              </div>
            </div>

            {/* ── 동반 승객(일행) ── */}
            {count > 1 && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-navy">동반 승객 정보</p>
                <p className="mt-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                  신청자 외 {count - 1}명의 이름·여권을 입력하세요. (미입력 시 출발 전까지 등록)
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  {pax.map((p, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="mb-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">승객 {i + 2}</p>
                      <DetailGrid fields={DETAIL_FIELDS} value={p} onField={(k, val) => setPaxField(i, k, val)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 여권 등록 ── */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-navy">여권 등록 (스캔)</p>
              <p className="mt-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                미입력 시 &lsquo;여권 미제출&rsquo;로 분류되며 출발 전까지 등록이 필요합니다.
              </p>
              {prefilled && (
                <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-medium text-emerald-600">
                  ✓ 계정에 저장된 여권 정보가 자동 입력되었습니다.
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-4">
                <Field label="여권번호">
                  <input className={inp} style={{ textTransform: "uppercase" }} value={passportNumber} onChange={(e) => setPassportNumber(e.target.value.toUpperCase())} placeholder="M12345678" />
                </Field>
                <Field label="여권 만료일">
                  <input type="text" inputMode="numeric" className={inp} value={passportExpiry} onChange={(e) => setPassportExpiry(dateMask(e.target.value))} placeholder="YYYY-MM-DD" maxLength={10} />
                </Field>
              </div>
              <div className="mt-3 flex items-center gap-4">
                {passportImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={passportImage} alt="여권 스캔" className="h-20 w-28 shrink-0 rounded-lg border border-slate-200 object-cover" />
                ) : (
                  <div className="grid h-20 w-28 shrink-0 place-items-center rounded-lg border border-dashed border-slate-300 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                    스캔 미리보기
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="inline-flex w-fit cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">
                    {uploading ? "업로드 중…" : passportImage ? "스캔 변경" : "여권 스캔 업로드"}
                    <input type="file" accept="image/*" className="hidden" onChange={onPickPassport} disabled={uploading} />
                  </label>
                  {passportImage && (
                    <button type="button" onClick={() => setPassportImage(undefined)} className="w-fit text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-red-500 hover:underline">
                      스캔 제거
                    </button>
                  )}
                </div>
              </div>

              {memberId ? (
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-500">
                  <input
                    type="checkbox"
                    checked={saveToAccount}
                    onChange={(e) => setSaveToAccount(e.target.checked)}
                    className="accent-brand"
                  />
                  이 여권 정보를 내 계정에 저장 (다음 신청 시 자동 입력)
                </label>
              ) : (
                <p className="mt-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                  로그인하면 여권 정보가 계정에 저장되어 다음부터 자동 입력됩니다.
                </p>
              )}
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">
                취소
              </button>
              <button type="submit" disabled={saving || uploading} className="rounded-lg bg-navy px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark disabled:opacity-50">
                {saving ? "신청 중…" : "가예약 신청"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-[1.25em] outline-none focus:border-brand";

type DetailField = { key: string; label: string; type?: "date" | "password" | "gender"; upper?: boolean; maxLength?: number };
const DETAIL_FIELDS: DetailField[] = [
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
// 신청자는 한글이름·여권번호·여권만료일을 위에서 이미 입력하므로 제외
const REP_FIELDS = DETAIL_FIELDS.filter(
  (f) => !["nameKo", "passportNumber", "passportExpiry"].includes(f.key),
);

// 날짜 입력을 YYYY-MM-DD 로 자동 포맷 (년도 뒤에도 대시)
function dateMask(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join("-");
}

function DetailGrid({
  fields,
  value,
  onField,
}: {
  fields: DetailField[];
  value: Record<string, string>;
  onField: (key: string, v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 max-[501px]:grid-cols-1">
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

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
