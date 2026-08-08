import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Review } from "./types";
import { reviews as seedData } from "./mock-data";

const COL = "reviews";
export type ReviewInput = Omit<Review, "id" | "views" | "createdAt">;

function toReview(id: string, d: Record<string, unknown>): Review {
  return {
    id,
    author: (d.author as string) ?? "",
    title: (d.title as string) ?? "",
    region: (d.region as string) ?? "",
    ship: (d.ship as string) ?? "",
    category: (d.category as string) ?? "",
    content: (d.content as string) ?? "",
    date: (d.date as string) ?? "",
    rating: (d.rating as number) ?? 5,
    views: (d.views as number) ?? 0,
    imageUrl: (d.imageUrl as string | undefined) ?? undefined,
    phone: (d.phone as string | undefined) ?? undefined,
    travelDate: (d.travelDate as string | undefined) ?? undefined,
    travelDest: (d.travelDest as string | undefined) ?? undefined,
    images: (d.images as string[] | undefined) ?? undefined,
    voyageId: (d.voyageId as string | undefined) ?? undefined,
    userId: (d.userId as string | undefined) ?? undefined,
    consentPrivacy: (d.consentPrivacy as boolean | undefined) ?? undefined,
    consentPromo: (d.consentPromo as boolean | undefined) ?? undefined,
    createdAt: (d.createdAt as string | undefined) ?? undefined,
    order: (d.order as number | undefined) ?? undefined,
  };
}

/** 정렬: 관리자 수동 순서(order) 우선, 없으면 최신순(작성일/여행일) */
function sortReviews(list: Review[]): Review[] {
  return [...list].sort(
    (a, b) =>
      (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
      (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date),
  );
}

export function subscribeReviews(cb: (r: Review[]) => void) {
  return onSnapshot(collection(db, COL), (snap) =>
    cb(sortReviews(snap.docs.map((x) => toReview(x.id, x.data())))),
  );
}

export async function addReview(data: ReviewInput) {
  const createdAt = new Date().toISOString().slice(0, 10);
  return (await addDoc(collection(db, COL), clean({ ...data, views: 0, createdAt }))).id;
}

export async function updateReview(id: string, data: Partial<Review>) {
  await updateDoc(doc(db, COL, id), clean(data));
}

/** 조회수 +1 (원자적). 클릭/조회 시 호출. 존재하지 않는 문서면 무시. */
export async function incrementReviewViews(id: string) {
  try {
    await updateDoc(doc(db, COL, id), { views: increment(1) });
  } catch {
    /* 샘플 등 문서 없음 → 무시 */
  }
}

export async function deleteReview(id: string) {
  await deleteDoc(doc(db, COL, id));
}

export async function seedReviews(): Promise<number> {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return 0;
  await Promise.all(seedData.map((r) => {
    const { id, ...rest } = r;
    return setDoc(doc(db, COL, id), clean(rest));
  }));
  return seedData.length;
}

function clean<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
