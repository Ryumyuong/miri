import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Consult, AlertItem } from "./types";
import { consults as seedData } from "./mock-data";

const COL = "consults";
export type ConsultInput = Omit<Consult, "id">;

function toConsult(id: string, d: Record<string, unknown>): Consult {
  return {
    id,
    customerName: (d.customerName as string) ?? "",
    phone: (d.phone as string) ?? "",
    topic: (d.topic as string) ?? "",
    status: (d.status as Consult["status"]) ?? "신규",
    createdAt: (d.createdAt as string) ?? "",
    reply: (d.reply as string | undefined) ?? undefined,
    repliedAt: (d.repliedAt as string | undefined) ?? undefined,
  };
}

/** 아직 답변하지 않은 상담문의(신규)를 운영 알림으로 변환 — 접수 즉시 관리자 알림에 표시 */
export function computeConsultAlerts(consults: Consult[]): AlertItem[] {
  return consults
    .filter((c) => c.status === "신규")
    .map((c) => {
      const topic = c.topic.replace(/\s+/g, " ").trim();
      return {
        id: `consult-new-${c.id}`,
        level: "info" as const,
        tag: "새 상담문의",
        message:
          `${c.customerName || "이름 미기재"} 고객 · ${c.phone || "연락처 미기재"}` +
          (c.createdAt ? ` (${c.createdAt} 접수)` : "") +
          (topic ? ` — ${topic.length > 40 ? topic.slice(0, 40) + "…" : topic}` : ""),
        href: "/admin/consults",
      };
    });
}

export function subscribeConsults(cb: (c: Consult[]) => void) {
  return onSnapshot(query(collection(db, COL), orderBy("createdAt", "desc")), (snap) =>
    cb(snap.docs.map((x) => toConsult(x.id, x.data()))),
  );
}
export async function addConsult(data: ConsultInput) {
  return (await addDoc(collection(db, COL), data)).id;
}
export async function updateConsult(id: string, data: Partial<ConsultInput>) {
  await updateDoc(doc(db, COL, id), data);
}
export async function deleteConsult(id: string) {
  await deleteDoc(doc(db, COL, id));
}
export async function seedConsults(): Promise<number> {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return 0;
  await Promise.all(seedData.map((c) => {
    const { id, ...rest } = c;
    return setDoc(doc(db, COL, id), rest);
  }));
  return seedData.length;
}
