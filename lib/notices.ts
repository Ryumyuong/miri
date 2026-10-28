import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

const COL = "notices";

export interface Notice {
  id: string;
  title: string;
  content: string; // RichText HTML
  pinned: boolean; // 상단 고정(중요 공지)
  images: string[]; // 첨부 이미지 (Storage URL)
  videos: string[]; // 첨부 영상 (Storage URL)
  createdAt: string; // ISO — 정렬용, 화면에는 날짜만
}

export type NoticeInput = Pick<Notice, "title" | "content" | "pinned" | "images" | "videos">;

function toNotice(id: string, d: Record<string, unknown>): Notice {
  return {
    id,
    title: (d.title as string) ?? "",
    content: (d.content as string) ?? "",
    pinned: (d.pinned as boolean) ?? false,
    images: (d.images as string[]) ?? [],
    videos: (d.videos as string[]) ?? [],
    createdAt: (d.createdAt as string) ?? "",
  };
}

/** 정렬: 고정 공지 우선, 그다음 최신순 */
function sortNotices(list: Notice[]): Notice[] {
  return [...list].sort(
    (a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt),
  );
}

export function subscribeNotices(cb: (n: Notice[]) => void) {
  return onSnapshot(collection(db, COL), (snap) =>
    cb(sortNotices(snap.docs.map((x) => toNotice(x.id, x.data())))),
  );
}

export async function addNotice(data: NoticeInput) {
  return (await addDoc(collection(db, COL), { ...data, createdAt: new Date().toISOString() })).id;
}

export async function updateNotice(id: string, data: Partial<NoticeInput>) {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteNotice(id: string) {
  await deleteDoc(doc(db, COL, id));
}
