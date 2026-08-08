import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { DayPlan, ItineraryDay, ItineraryDraft, Voyage, VoyageStatus } from "./types";
import { voyages as seedData } from "./mock-data";

const COL = "voyages";

/** 1척 정원(자동 마감 판정용) */
const CAPACITY = 30;

/** 출항일 기준 D-day 자동 계산 (오늘 0시 기준). 출발일이 지나면 음수. */
export function computeDDay(departDate: string): number {
  if (!departDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const depart = new Date(departDate + "T00:00:00");
  return Math.round((depart.getTime() - today.getTime()) / 86400000);
}

/** 출항일 + 예약 인원으로 예약 상태 자동 계산 */
export function computeStatus(departDate: string, reservedCount: number): VoyageStatus {
  const dday = computeDDay(departDate);
  if (dday < 0) return "마감"; // 출발일 경과
  if (reservedCount >= CAPACITY) return "마감"; // 정원 마감
  if (dday <= 14) return "출발 확정"; // 출발 임박
  if (reservedCount > 0) return "예약 중";
  return "예약 가능";
}

// status·dDay 는 자동 계산, 예약/여권/계약 지표는 신청 데이터에서 집계되므로 입력에서 제외
export type VoyageInput = Omit<
  Voyage,
  "id" | "status" | "dDay" | "reservedCount" | "passportDone" | "passportPending" | "contractCount"
>;

function toVoyage(id: string, data: Record<string, unknown>): Voyage {
  const departDate = (data.departDate as string) ?? "";
  const reservedCount = (data.reservedCount as number) ?? 0;
  const statusManual = (data.statusManual as VoyageStatus | undefined) ?? undefined;
  return {
    id,
    code: (data.code as string | undefined) ?? undefined,
    title: (data.title as string) ?? "",
    region: (data.region as string) ?? "",
    shipName: (data.shipName as string) ?? "",
    line: (data.line as string) ?? "",
    departDate,
    arriveDate: (data.arriveDate as string) ?? "",
    nights: (data.nights as number) ?? 0,
    days: (data.days as number) ?? 0,
    priceFrom: (data.priceFrom as number) ?? 0,
    roomPrices: (data.roomPrices as Record<string, number> | undefined) ?? undefined,
    // 직접 지정값이 있으면 사용, 없으면 자동 계산
    status: statusManual ?? computeStatus(departDate, reservedCount),
    statusManual,
    countries: (data.countries as string[]) ?? [],
    itinerary: (data.itinerary as string[]) ?? [],
    dayPlans: (data.dayPlans as DayPlan[] | undefined) ?? undefined,
    itineraryDays: (data.itineraryDays as ItineraryDay[] | undefined) ?? undefined,
    itineraryDaysDraft: (data.itineraryDaysDraft as ItineraryDay[] | undefined) ?? undefined,
    itineraryDrafts: (data.itineraryDrafts as ItineraryDraft[] | undefined) ?? undefined,
    itineraryStatus: (data.itineraryStatus as "draft" | "published" | undefined) ?? undefined,
    published: (data.published as boolean | undefined) ?? undefined,
    dDay: computeDDay(departDate),
    reservedCount,
    passportDone: (data.passportDone as number) ?? 0,
    passportPending: (data.passportPending as number) ?? 0,
    contractCount: (data.contractCount as number) ?? 0,
    thumbnail: (data.thumbnail as string | undefined) ?? undefined,
    flight: (data.flight as string | undefined) ?? undefined,
    description: (data.description as string | undefined) ?? undefined,
    features: (data.features as string[] | undefined) ?? undefined,
    included: (data.included as string[] | undefined) ?? undefined,
    excluded: (data.excluded as string[] | undefined) ?? undefined,
    meetingPlace: (data.meetingPlace as string | undefined) ?? undefined,
    meetingTime: (data.meetingTime as string | undefined) ?? undefined,
    meetingInfo: (data.meetingInfo as string | undefined) ?? undefined,
    meetingMapImage: (data.meetingMapImage as string | undefined) ?? undefined,
    meetingMapUrl: (data.meetingMapUrl as string | undefined) ?? undefined,
    routeMapImage: (data.routeMapImage as string | undefined) ?? undefined,
    guide: (data.guide as string | undefined) ?? undefined,
    insurance: (data.insurance as string | undefined) ?? undefined,
    isPrime: (data.isPrime as boolean | undefined) ?? undefined,
    primeOrder: (data.primeOrder as number | undefined) ?? undefined,
    terms: (data.terms as string[] | undefined) ?? undefined,
    safety: (data.safety as { title: string; body: string }[] | undefined) ?? undefined,
    productImages: (data.productImages as string[] | undefined) ?? undefined,
    videos: (data.videos as { label: string; url: string }[] | undefined) ?? undefined,
  };
}

/** 실시간 구독 (출항일 오름차순). 해지 함수를 반환합니다. */
export function subscribeVoyages(cb: (voyages: Voyage[]) => void) {
  const q = query(collection(db, COL), orderBy("departDate"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => toVoyage(d.id, d.data())));
  });
}

/** 단건 조회 (1회). */
export async function getVoyagesOnce(): Promise<Voyage[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy("departDate")));
  return snap.docs.map((d) => toVoyage(d.id, d.data()));
}

/** 상품코드 자동 발번 — 예: MC-48217 (입력값 없을 때만) */
function genVoyageCode(): string {
  return `MC-${Math.floor(10000 + Math.random() * 90000)}`;
}

export async function addVoyage(data: VoyageInput) {
  const withCode = data.code ? data : { ...data, code: genVoyageCode() };
  const ref = await addDoc(collection(db, COL), cleanUndefined(withCode));
  return ref.id;
}

/** 코드 없는 기존 voyage 들에 MC-00001 형식으로 순차 발번 (중복 회피). 발번 개수 반환. */
export async function backfillVoyageCodes(voyages: Voyage[]): Promise<number> {
  const used = new Set(voyages.map((v) => v.code).filter(Boolean) as string[]);
  let n = 1;
  const nextCode = () => {
    let code: string;
    do {
      code = `MC-${String(n).padStart(5, "0")}`;
      n++;
    } while (used.has(code));
    used.add(code);
    return code;
  };
  const targets = voyages.filter((v) => !v.code);
  await Promise.all(targets.map((v) => updateDoc(doc(db, COL, v.id), { code: nextCode() })));
  return targets.length;
}

export async function updateVoyage(id: string, data: Partial<VoyageInput>) {
  await updateDoc(doc(db, COL, id), cleanUndefined(data));
}

export async function deleteVoyage(id: string) {
  await deleteDoc(doc(db, COL, id));
}

/** 컬렉션이 비어 있으면 샘플 6건을 시드합니다 (id 보존). */
export async function seedVoyages(): Promise<number> {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return 0;
  await Promise.all(
    seedData.map((v) => {
      const { id, ...rest } = v;
      return setDoc(doc(db, COL, id), cleanUndefined(rest));
    }),
  );
  return seedData.length;
}

// Firestore 는 undefined 필드를 거부하므로 제거
function cleanUndefined<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  );
}
