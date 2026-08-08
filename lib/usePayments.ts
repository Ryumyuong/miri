"use client";

import { useEffect, useState } from "react";
import type { Payment } from "./types";
import { subscribePayments } from "./payments";

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = subscribePayments((p) => {
      setPayments(p);
      setLoading(false);
    });
    return unsub;
  }, []);
  return { payments, loading };
}
