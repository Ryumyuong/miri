import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Consult } from "./types";
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
