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
import type { PortCard, PortKind, Voyage } from "./types";
import { portCards as seedData } from "./mock-data";

const COL = "portCards";

export type PortInput = Omit<PortCard, "id">;

/**
 * 한 운항 일정의 관광정보에 노출되는 항구 카드 목록.
 * 일정표 카드 관리에서 이 일정을 명시적으로 지정(voyageIds)한 카드만 노출한다.
 * 상세페이지 관광정보와 "사용 상품 수" 집계가 같은 기준을 쓰도록 공용화.
 */
export function relatedPortsFor(voyage: Voyage, ports: PortCard[]): PortCard[] {
  return ports.filter((p) => (p.voyageIds ?? []).includes(voyage.id));
}

function toPort(id: string, data: Record<string, unknown>): PortCard {
  return {
    id,
    name: (data.name as string) ?? "",
    kind: ((data.kind as PortKind) ?? "기항지"),
    region: (data.region as string) ?? "",
    country: (data.country as string) ?? "",
    description: (data.description as string) ?? "",
    imageUrl: (data.imageUrl as string | undefined) ?? undefined,
    usedByCount: (data.usedByCount as number) ?? 0,
    voyageIds: (data.voyageIds as string[]) ?? [],
    order: (data.order as number) ?? undefined,
  };
}

export function subscribePorts(cb: (ports: PortCard[]) => void) {
  const q = query(collection(db, COL), orderBy("name"));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => toPort(d.id, d.data()))));
}

export async function addPort(data: PortInput) {
  const ref = await addDoc(collection(db, COL), clean(data));
  return ref.id;
}

export async function updatePort(id: string, data: Partial<PortInput>) {
  await updateDoc(doc(db, COL, id), clean(data));
}

export async function deletePort(id: string) {
  await deleteDoc(doc(db, COL, id));
}

export async function seedPorts(): Promise<number> {
  const snap = await getDocs(collection(db, COL));
  if (!snap.empty) return 0;
  await Promise.all(
    seedData.map((p) => {
      const { id, ...rest } = p;
      return setDoc(doc(db, COL, id), clean(rest));
    }),
  );
  return seedData.length;
}

function clean<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
