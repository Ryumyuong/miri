import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type { AlertItem } from "./types";
import { alerts as seedData } from "./mock-data";

const COL = "alerts";
export type AlertInput = Omit<AlertItem, "id">;

function toAlert(id: string, d: Record<string, unknown>): AlertItem {
  return {
    id,
    level: (d.level as AlertItem["level"]) ?? "info",
    tag: (d.tag as string) ?? "",
    message: (d.message as string) ?? "",
  };
}

export function subscribeAlerts(cb: (a: AlertItem[]) => void) {
  return onSnapshot(collection(db, COL), (snap) =>
    cb(snap.docs.map((x) => toAlert(x.id, x.data()))),
  );
}
export async function addAlert(data: AlertInput) {
  return (await addDoc(collection(db, COL), data)).id;
}
export async function updateAlert(id: string, data: Partial<AlertInput>) {
  await updateDoc(doc(db, COL, id), data);
}
export async function deleteAlert(id: string) {
  await deleteDoc(doc(db, COL, id));
}
export async function seedAlerts(): Promise<number> {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return 0;
  await Promise.all(seedData.map((a) => {
    const { id, ...rest } = a;
    return setDoc(doc(db, COL, id), rest);
  }));
  return seedData.length;
}
