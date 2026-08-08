"use client";

import { useEffect, useState } from "react";
import type { Reservation } from "./types";
import { subscribeReservations } from "./reservations";

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeReservations((r) => {
      setReservations(r);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { reservations, loading };
}
