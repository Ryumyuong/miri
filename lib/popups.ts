import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

const COL = "popups";

export interface Popup {
  id: string;
  title: string; // 관리용 이름 (사이트에는 이미지 대체텍스트로만 사용)
  image: string; // 팝업 이미지 (Storage URL)
  link: string; // 이미지 클릭 시 이동 주소 — "/notice" 같은 사이트 내부 경로 또는 https://…
  newWindow: boolean; // 링크를 새 창으로 열기
  active: boolean; // 노출 여부
  startDate: string; // YYYY-MM-DD, 비우면 즉시
  endDate: string; // YYYY-MM-DD, 비우면 계속
  order: number; // 여러 개일 때 표시 순서 (작을수록 먼저)
  createdAt: string;
}

export type PopupInput = Omit<Popup, "id" | "createdAt">;

function toPopup(id: string, d: Record<string, unknown>): Popup {
  return {
    id,
    title: (d.title as string) ?? "",
    image: (d.image as string) ?? "",
    link: (d.link as string) ?? "",
    newWindow: (d.newWindow as boolean) ?? false,
    active: (d.active as boolean) ?? true,
    startDate: (d.startDate as string) ?? "",
    endDate: (d.endDate as string) ?? "",
    order: (d.order as number) ?? 0,
    createdAt: (d.createdAt as string) ?? "",
  };
}

function sortPopups(list: Popup[]): Popup[] {
  return [...list].sort((a, b) => a.order - b.order || b.createdAt.localeCompare(a.createdAt));
}

/** 오늘(로컬) 기준 노출 대상인지 */
export function isPopupLive(p: Popup, today = localToday()): boolean {
  if (!p.active || !p.image) return false;
  if (p.startDate && today < p.startDate) return false;
  if (p.endDate && today > p.endDate) return false;
  return true;
}

export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function subscribePopups(cb: (p: Popup[]) => void) {
  return onSnapshot(collection(db, COL), (snap) =>
    cb(sortPopups(snap.docs.map((x) => toPopup(x.id, x.data())))),
  );
}

export async function addPopup(data: PopupInput) {
  return (await addDoc(collection(db, COL), { ...data, createdAt: new Date().toISOString() })).id;
}

export async function updatePopup(id: string, data: Partial<PopupInput>) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deletePopup(id: string) {
  await deleteDoc(doc(db, COL, id));
}
