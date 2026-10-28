import type { Passenger, Reservation, CancellationEvent } from "./types";

/** Missing passengers means legacy headcount; an explicit empty array means zero. */
export function membersOf(r: Reservation): Passenger[] {
  if (Array.isArray(r.passengers)) return r.passengers;
  const n = Number.isFinite(r.headcount) ? Math.max(0, Math.floor(r.headcount)) : 1;
  return Array.from({ length: n }, (_, i) => i === 0
    ? { id: r.id, nameKo: r.name, phone: r.phone, roomType: r.room, passportNumber: r.passportNumber, passportExpiry: r.passportExpiry }
    : { id: r.id + "-p" + i, roomType: r.room });
}
export function activeMembers(r: Reservation): Passenger[] {
  return r.status === "cancelled" ? [] : membersOf(r).filter(p => p.status !== "cancelled");
}
export function paxOf(r: Reservation): number { return activeMembers(r).length; }
export function cancellationPatch(value: { cancellationHistory?: CancellationEvent[] }, cancelled: boolean, at: string) {
  return { status: cancelled ? "cancelled" as const : "active" as const,
    ...(cancelled ? { cancelledAt: at } : {}),
    cancellationHistory: [...(value.cancellationHistory ?? []), { action: cancelled ? "cancel" as const : "restore" as const, at }] };
}
/** Room letters are local to each reservation, never shared across teams. */
export function compareRooming(a: { r: Reservation; m: Passenger }, b: { r: Reservation; m: Passenger }) {
  const team = (a.r.code || a.r.id).localeCompare(b.r.code || b.r.id) || a.r.id.localeCompare(b.r.id);
  if (team) return team;
  const rank = (s = "") => { s=s.trim(); return !s ? "3" : /^[a-z]$/i.test(s) ? "0"+s.toUpperCase() : "2"+s.toLowerCase(); };
  return rank(a.m.rooming).localeCompare(rank(b.m.rooming), undefined, { numeric: true });
}

/** Registered manifest passengers + additional offline passengers without manifest entries.
 * Never add Voyage.reservedCount: it is an old cached figure, not another source.
 */
export function reservationTotals(v: { capacity?: number; offlineHold?: number }, registeredPax: number) {
  const count = (n: number) => Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const registered = count(registeredPax);
  const offline = count(v.offlineHold ?? 0);
  const capacity = count(v.capacity ?? 30);
  const total = registered + offline;
  return { registered, offline, total, capacity, remaining: Math.max(0, capacity - total) };
}

/** A document ID identifies one team. Distinct IDs must never be merged by name/code. */
export function uniqueReservations(reservations: Reservation[]) {
  return [...new Map(reservations.map(r => [r.id, r])).values()];
}
