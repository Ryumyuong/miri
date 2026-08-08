"use client";

import { useEffect, useState } from "react";
import type { AlertItem } from "./types";
import { subscribeAlerts } from "./alerts";

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribeAlerts((a) => {
      setAlerts(a);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { alerts, loading };
}
