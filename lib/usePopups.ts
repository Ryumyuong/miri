"use client";

import { useEffect, useState } from "react";
import { subscribePopups, type Popup } from "./popups";

/** Firestore 팝업 구독 (표시 순서 → 최신순) */
export function usePopups() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePopups((p) => {
      setPopups(p);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { popups, loading };
}
