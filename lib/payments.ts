import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Payment } from "./types";
import { payments as seedData } from "./mock-data";

const COL = "payments";
export type PaymentInput = Omit<Payment, "id">;

function toPayment(id: string, d: Record<string, unknown>): Payment {
  return {
    id,
    customerName: (d.customerName as string) ?? "",
    voyageTitle: (d.voyageTitle as string) ?? "",
    amount: (d.amount as number) ?? 0,
    paid: (d.paid as number) ?? 0,
    status: (d.status as Payment["status"]) ?? "미결제",
    date: (d.date as string) ?? "",
  };
}

export function subscribePayments(cb: (p: Payment[]) => void) {
  return onSnapshot(query(collection(db, COL), orderBy("date", "desc")), (snap) =>
    cb(snap.docs.map((x) => toPayment(x.id, x.data()))),
  );
}
export async function addPayment(data: PaymentInput) {
  return (await addDoc(collection(db, COL), data)).id;
}
export async function updatePayment(id: string, data: Partial<PaymentInput>) {
  await updateDoc(doc(db, COL, id), data);
}
export async function deletePayment(id: string) {
  await deleteDoc(doc(db, COL, id));
}
export async function seedPayments(): Promise<number> {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return 0;
  await Promise.all(seedData.map((p) => {
    const { id, ...rest } = p;
    return setDoc(doc(db, COL, id), rest);
  }));
  return seedData.length;
}
