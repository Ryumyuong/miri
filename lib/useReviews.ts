"use client";

import { useEffect, useState } from "react";
import type { Review } from "./types";
import { subscribeReviews } from "./reviews";

/** Firestore 실제 후기만 구독 (mock 대체 없음). */
export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeReviews((r) => {
      setReviews(r);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { reviews, raw: reviews, loading };
}
