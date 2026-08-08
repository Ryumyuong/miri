"use client";

import { useState } from "react";
import { useReviews } from "@/lib/useReviews";
import ReviewsBoard from "./ReviewsBoard";
import ReviewForm from "./ReviewForm";
import { SAMPLE_REVIEWS } from "./ReviewsLive";

export default function ReviewsBoardLive() {
  const { reviews } = useReviews();
  const [open, setOpen] = useState(false);
  const data = reviews.length > 0 ? reviews : SAMPLE_REVIEWS; // 실제 후기 없으면 홈과 동일한 샘플 표시

  return (
    <>
      <ReviewsBoard reviews={data} onWrite={() => setOpen(true)} />
      {open && <ReviewForm onClose={() => setOpen(false)} />}
    </>
  );
}
