import {
  collection, doc, addDoc, updateDoc, runTransaction, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Reservation, AlertItem, Voyage } from "./types";
import { buildContractMessage, sendContractSms } from "./sms";

import { activeMembers, paxOf, cancellationPatch, uniqueReservations } from "./reservation-state";
export { paxOf } from "./reservation-state";

const COL = "reservations";

export type ReservationInput = Omit<Reservation, "id" | "createdAt">;

function toReservation(id: string, d: Record<string, unknown>): Reservation {
  return {
    id,
    status: d.status === "cancelled" ? "cancelled" : "active",
    cancelledAt: d.cancelledAt as string | undefined,
    cancellationHistory: d.cancellationHistory as Reservation["cancellationHistory"],
    code: (d.code as string | undefined) ?? undefined,
    passengers: (d.passengers as Reservation["passengers"]) ?? undefined,
    contractSentAt: (d.contractSentAt as string | undefined) ?? undefined,
    voyageChangeHistory: (d.voyageChangeHistory as Reservation["voyageChangeHistory"]) ?? undefined,
    source: d.source === "admin" || d.source === "web" ? d.source : undefined,
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
  await setReservationCancelled(id, true);
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


/** 이 상품에 홈페이지로 접수된 총 신청 인원 (일행 포함) */
export function bookedPaxFor(reservations: Reservation[], voyageId: string): number {
  return uniqueReservations(reservations).filter((r) => r.voyageId === voyageId).reduce((s, r) => s + paxOf(r), 0);
}

/** 특정 운항 일정의 예약 지표를 실제 신청 데이터에서 집계 */
export function aggregateForVoyage(reservations: Reservation[], voyageId: string): VoyageAgg {
  const list = uniqueReservations(reservations).filter((r) => r.voyageId === voyageId && paxOf(r) > 0);
  // 여권 제출은 '팀'이 아니라 '사람' 기준으로 센다.
  // 대표자만 보고 세면 4명 예약이 1명으로 잡혀 미제출 수가 실제보다 적게 나온다.
  const pax = list.reduce((s, r) => s + paxOf(r), 0);
  const passportDone = list.reduce(
    (s, r) => s + activeMembers(r).filter((p) => !!p.passportExpiry).length,
    0,
  );
  return {
    reservedCount: list.length,
    pax,
    passportDone,
    passportPending: pax - passportDone,
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
    if (!paxOf(r)) continue;
    // 클릭 시 해당 상품의 예약 목록으로 이동하면서 그 승객의 정보 입력창을 바로 연다
    const href = `/admin/voyages/${r.voyageId}?resv=${r.id}`;
    // 대표자만이 아니라 일행 전원 기준으로 미제출 인원을 센다
    const pax = paxOf(r);
    const done = activeMembers(r).filter((p) => !!p.passportExpiry).length;
    const missing = pax - done;
    if (missing > 0) {
      out.push({
        id: `pp-missing-${r.id}`,
        level: "warning",
        tag: "미제출",
        message: `${r.name} 고객 - 여권 정보 미제출${pax > 1 ? ` (${missing}/${pax}명)` : ""}`,
        href,
      });
    } else if (activeMembers(r).some(p => !!p.passportExpiry && expiresWithin6MonthsOfArrival(p.passportExpiry, r.arriveDate))) {
      out.push({
        id: `pp-expiry-${r.id}`,
        level: "danger",
        tag: "여권 만료",
        message: `${r.name} 고객 - 여권 만료 6개월 미만`,
        href,
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

/** Soft cancellation preserves passenger and contact data. Transaction retries are idempotent. */
export async function setReservationCancelled(id: string, cancelled: boolean) {
  const ref = doc(db, COL, id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("예약을 찾을 수 없습니다.");
    const r = toReservation(id, snap.data());
    if ((r.status === "cancelled") === cancelled) return;
    tx.update(ref, cancellationPatch(r, cancelled, new Date().toISOString()));
  });
}

/** 키 순서와 무관한 JSON — 로컬 캐시(입력 순서)와 서버 응답(정렬 순서)의 키 순서가 달라도 같은 값으로 본다 */
function stableJson(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(x => stableJson(x ?? null)).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v).sort()
      .filter(k => (v as Record<string, unknown>)[k] !== undefined)
      .map(k => `${JSON.stringify(k)}:${stableJson((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v) ?? "null";
}

/** 상품에 등록된 객실타입별 요금 — 객실타입 요금이 없으면 최저가 */
export function registeredPrice(v: Voyage, roomType?: string): number | undefined {
  const byRoom = roomType ? v.roomPrices?.[roomType] : undefined;
  return byRoom || v.priceFrom || undefined;
}

/**
 * 예약을 다른 운항 일정(같은 상품의 다른 출발일 또는 다른 상품)으로 이동. 예약코드·승객·여권·계약 상태는 유지.
 * 상품가가 원래 일정의 등록 요금 그대로인 승객만 새 일정 요금으로 바꾸고, 직접 고친 금액은 둔다.
 */
export async function changeReservationVoyage(original: Reservation, from: Voyage, to: Voyage) {
  const ref = doc(db, COL, original.id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("예약을 찾을 수 없습니다.");
    const latest = toReservation(original.id, snap.data());
    if (latest.voyageId !== from.id || latest.status === "cancelled")
      throw new Error("이 창을 연 뒤에 예약이 다른 곳에서 변경되었습니다.\n새로고침 후 다시 시도해 주세요.");
    const passengers = latest.passengers?.map(p =>
      p.productPrice == null || p.productPrice === registeredPrice(from, p.roomType)
        ? clean({ ...p, productPrice: registeredPrice(to, p.roomType) }) as unknown as typeof p
        : p,
    );
    const at = new Date().toISOString();
    tx.update(ref, clean({
      voyageId: to.id,
      voyageTitle: to.title,
      departDate: to.departDate,
      arriveDate: to.arriveDate,
      passengers,
      voyageChangeHistory: [
        ...(latest.voyageChangeHistory ?? []),
        {
          at,
          fromVoyageId: from.id, fromVoyageTitle: latest.voyageTitle, fromDepartDate: latest.departDate,
          toVoyageId: to.id, toVoyageTitle: to.title, toDepartDate: to.departDate,
        },
      ],
    }));
  });
}

/** Refuse stale edits rather than overwriting another operator's passenger/cancellation changes. */
export async function saveReservationPassengers(original: Reservation, passengers: Reservation["passengers"]) {
  const ref = doc(db, COL, original.id);
  await runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("예약을 찾을 수 없습니다.");
    const latest = toReservation(original.id, snap.data());
    if (stableJson(latest.passengers) !== stableJson(original.passengers) || latest.status === "cancelled")
      throw new Error("이 창을 연 뒤에 다른 곳에서 예약 정보가 먼저 수정되었습니다.\n창을 닫고 다시 열어 최신 내용을 확인한 뒤 입력해 주세요.");
    tx.update(ref, { passengers });
  });
}

