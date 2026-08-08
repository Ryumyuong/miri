"use client";

import { useEffect, useState } from "react";
import type { Voyage } from "./types";
import { subscribeVoyages } from "./voyages";

/** Firestore voyages 실시간 구독 훅. */
export function useVoyages() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeVoyages((vs) => {
      setVoyages(vs);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { voyages, loading };
}
