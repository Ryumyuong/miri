import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Reservation, AlertItem, Voyage } from "./types";
import { buildContractMessage, sendContractSms } from "./sms";

const COL = "reservations";

export type ReservationInput = Omit<Reservation, "id" | "createdAt">;

function toReservation(id: string, d: Record<string, unknown>): Reservation {
  return {
    id,
    code: (d.code as string | undefined) ?? undefined,
    passengers: (d.passengers as Reservation["passengers"]) ?? undefined,
    contractSentAt: (d.contractSentAt as string | undefined) ?? undefined,
    voyageId: (d.voyageId as string) ?? "",
    voyageTitle: (d.voyageTitle as string) ?? "",
    departDate: (d.departDate as string) ?? "",
    arriveDate: (d.arriveDate as string) ?? "",
    name: (d.name as string) ?? "",
    phone: (d.phone as string) ?? "",
    room: (d.room as string) ?? "",
    roomNo: (d.roomNo as string | undefined) ?? undefined,
    headcount: (d.headcount as number) ?? 1,
    passportNumber: (d.passportNumber as string | undefined) ?? undefined,
    passportExpiry: (d.passportExpiry as string | undefined) ?? undefined,
    passportImage: (d.passportImage as string | undefined) ?? undefined,
    contractPaid: (d.contractPaid as boolean) ?? false,
    createdAt: (d.createdAt as string) ?? "",
  };
}

export function subscribeReservations(cb: (r: Reservation[]) => void) {
  return onSnapshot(query(collection(db, COL), orderBy("createdAt", "desc")), (snap) =>
    cb(snap.docs.map((x) => toReservation(x.id, x.data()))),
  );
}

/** 예약코드(일행 단위) 자동 생성 — 예: MC25-3F9A */
function genReservationCode(): string {
  const yy = new Date().getFullYear().toString().slice(2);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MC${yy}-${rand}`;
}

export async function addReservation(data: ReservationInput) {
  // 초 단위까지 기록 → 같은 날 추가해도 신규가 항상 뒤에 정렬됨
  const createdAt = new Date().toISOString();
  const code = data.code ?? genReservationCode();
  return (await addDoc(collection(db, COL), clean({ ...data, code, createdAt }))).id;
}

export async function updateReservation(id: string, data: Partial<ReservationInput>) {
  await updateDoc(doc(db, COL, id), clean(data));
}

/** 여행자 계약서 문자 발송 + 발송 시각 기록(발송됨 표기). 성공 시 true. */
export async function sendReservationContract(r: {
  id: string;
  name?: string;
  phone?: string;
  voyageTitle: string;
  code?: string;
}): Promise<boolean> {
  if (!r.phone) return false;
  const msg = buildContractMessage({ name: r.name, voyageTitle: r.voyageTitle, code: r.code });
  const res = await sendContractSms(r.phone, msg); // 게이트웨이 미연동 시 no-op(ok)
  if (res.ok) {
    await updateReservation(r.id, { contractSentAt: new Date().toISOString() });
    return true;
  }
  return false;
}

export async function deleteReservation(id: string) {
  await deleteDoc(doc(db, COL, id));
}

// ── 여권 완료 판정: 만료일이 등록되어 있으면 "완료" ──
export function hasPassport(r: Reservation): boolean {
  return !!r.passportExpiry;
}

export interface VoyageAgg {
  reservedCount: number; // 예약 건수(=팀 수)
  pax: number; // 총 인원(일행 합산)
  passportDone: number;
  passportPending: number;
  contractCount: number;
}

/** 예약 1건의 인원수(일행 포함) */
export function paxOf(r: Reservation): number {
  return r.passengers?.length ?? r.headcount ?? 1;
}

/** 특정 운항 일정의 예약 지표를 실제 신청 데이터에서 집계 */
export function aggregateForVoyage(reservations: Reservation[], voyageId: string): VoyageAgg {
  const list = reservations.filter((r) => r.voyageId === voyageId);
  const passportDone = list.filter(hasPassport).length;
  return {
    reservedCount: list.length,
    pax: list.reduce((s, r) => s + paxOf(r), 0),
    passportDone,
    passportPending: list.length - passportDone,
    contractCount: list.filter((r) => r.contractPaid).length,
  };
}

/** 여권 만료일이 도착일 기준 6개월 이내(=도착일+6개월 이전 만료)인지 */
export function expiresWithin6MonthsOfArrival(passportExpiry: string, arriveDate: string): boolean {
  if (!passportExpiry || !arriveDate) return false;
  const expiry = new Date(passportExpiry + "T00:00:00");
  const threshold = new Date(arriveDate + "T00:00:00");
  threshold.setMonth(threshold.getMonth() + 6); // 도착일 + 6개월
  return expiry.getTime() < threshold.getTime();
}

/** 신청 데이터로부터 여권 상태 알림을 자동 생성 (저장하지 않고 계산) */
export function computePassportAlerts(reservations: Reservation[]): AlertItem[] {
  const out: AlertItem[] = [];
  for (const r of reservations) {
    if (!hasPassport(r)) {
      out.push({
        id: `pp-missing-${r.id}`,
        level: "warning",
        tag: "미제출",
        message: `${r.name} 고객 - 여권 정보 미제출`,
      });
    } else if (expiresWithin6MonthsOfArrival(r.passportExpiry!, r.arriveDate)) {
      out.push({
        id: `pp-expiry-${r.id}`,
        level: "danger",
        tag: "여권 만료",
        message: `${r.name} 고객 - 여권 만료 6개월 미만`,
      });
    }
  }
  return out;
}

/** 만료일 = 기준일 + months 개월 (YYYY-MM-DD) */
function addMonthsISO(iso: string, months: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/** 데모용: 특정 운항 일정에 샘플 가예약 3건을 생성 (여권 완료/만료임박/미제출) */
export async function seedReservationsForVoyage(v: Voyage): Promise<number> {
  const arrive = v.arriveDate || v.departDate;
  const samples: ReservationInput[] = [
    {
      voyageId: v.id, voyageTitle: v.title, departDate: v.departDate, arriveDate: v.arriveDate,
      name: "김미리", phone: "010-1234-5678", room: "발코니", headcount: 2,
      passportNumber: "M11112222", passportExpiry: addMonthsISO(arrive, 18), contractPaid: true,
    },
    {
      // 도착일 + 3개월 만료 → 도착일+6개월 이전이라 "여권 만료 6개월 미만" 알림 발생
      voyageId: v.id, voyageTitle: v.title, departDate: v.departDate, arriveDate: v.arriveDate,
      name: "홍길동", phone: "010-2222-3333", room: "오션뷰", headcount: 1,
      passportNumber: "M33334444", passportExpiry: addMonthsISO(arrive, 3), contractPaid: true,
    },
    {
      // 여권 미등록 → "여권 정보 미제출" 알림 발생
      voyageId: v.id, voyageTitle: v.title, departDate: v.departDate, arriveDate: v.arriveDate,
      name: "이여행", phone: "010-4444-5555", room: "내측", headcount: 3, contractPaid: false,
    },
  ];
  await Promise.all(samples.map((s) => addReservation(s)));
  return samples.length;
}

function clean<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
