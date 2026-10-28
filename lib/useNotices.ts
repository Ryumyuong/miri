"use client";

import { useEffect, useState } from "react";
import { subscribeNotices, type Notice } from "./notices";

/** Firestore 공지사항 구독 (고정 공지 → 최신순) */
export function useNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeNotices((n) => {
      setNotices(n);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { notices, loading };
}
