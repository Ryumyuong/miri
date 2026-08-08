"use client";

import { useEffect, useState } from "react";
import type { Consult } from "./types";
import { subscribeConsults } from "./consults";

export function useConsults() {
  const [consults, setConsults] = useState<Consult[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeConsults((c) => {
      setConsults(c);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { consults, loading };
}
