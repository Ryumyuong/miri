import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, onSnapshot, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ShipCard } from "./types";
import { shipCards as seedData } from "./mock-data";

const COL = "shipCards";
export type ShipInput = Omit<ShipCard, "id">;

function toShip(id: string, d: Record<string, unknown>): ShipCard {
  return {
    id,
    name: (d.name as string) ?? "",
    line: (d.line as string) ?? "",
    roomType: (d.roomType as string | undefined) ?? undefined,
    capacity: (d.capacity as number | undefined) ?? undefined,
    description: (d.description as string) ?? "",
    imageUrl: (d.imageUrl as string | undefined) ?? undefined,
    productImages: (d.productImages as string[] | undefined) ?? undefined,
    features: (d.features as string[] | undefined) ?? undefined,
    usedByCount: (d.usedByCount as number) ?? 0,
  };
}

export function subscribeShips(cb: (s: ShipCard[]) => void) {
  return onSnapshot(query(collection(db, COL), orderBy("name")), (snap) =>
    cb(snap.docs.map((x) => toShip(x.id, x.data()))),
  );
}
export async function addShip(data: ShipInput) {
  return (await addDoc(collection(db, COL), clean(data))).id;
}
export async function updateShip(id: string, data: Partial<ShipInput>) {
  await updateDoc(doc(db, COL, id), clean(data));
}
export async function deleteShip(id: string) {
  await deleteDoc(doc(db, COL, id));
}
export async function seedShips(): Promise<number> {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return 0;
  await Promise.all(seedData.map((s) => {
    const { id, ...rest } = s;
    return setDoc(doc(db, COL, id), clean(rest));
  }));
  return seedData.length;
}
function clean<T extends Record<string, unknown>>(o: T) {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
}
