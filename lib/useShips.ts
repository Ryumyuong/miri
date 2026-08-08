"use client";

import { useEffect, useState } from "react";
import type { ShipCard } from "./types";
import { subscribeShips } from "./ships";

export function useShips() {
  const [ships, setShips] = useState<ShipCard[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeShips((s) => {
      setShips(s);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { ships, loading };
}
