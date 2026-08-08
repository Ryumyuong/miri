"use client";

import { useEffect, useState } from "react";
import type { PortCard } from "./types";
import { subscribePorts } from "./ports";

export function usePorts() {
  const [ports, setPorts] = useState<PortCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePorts((p) => {
      setPorts(p);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { ports, loading };
}
