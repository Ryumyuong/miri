"use client";

import type { Review } from "@/lib/types";
import { useReviews } from "@/lib/useReviews";
import Reviews from "./Reviews";

/** 실제 후기가 없을 때 보여줄 샘플 더미 후기 3개. */
export const SAMPLE_REVIEWS: Review[] = [
  {
    id: "sample-1",
    author: "김**",
    title: "첫 크루즈, 편안하게 즐겼어요",
    region: "서부지중해",
    ship: "Costa Smeralda",
    category: "유럽",
    content:
      "미리크루즈 덕분에 첫 크루즈 여행이었지만 정말 편안하게 즐겼습니다. 출발 전 안내가 꼼꼼해서 안심했어요.",
    date: "2026-04-12",
    rating: 5,
    views: 0,
    imageUrl: "/reviews/review-1.png",
  },
  {
    id: "sample-2",
    author: "이**",
    title: "잊지 못할 빙하 풍경",
    region: "알래스카",
    ship: "Voyager of the Seas",
    category: "미주·알래스카",
    content:
      "빙하 풍경이 잊혀지지 않습니다. 인솔자분이 함께해주셔서 부모님 모시고 가기에도 부담이 없었어요.",
    date: "2026-03-29",
    rating: 5,
    views: 0,
    imageUrl: "/reviews/review-2.png",
  },
  {
    id: "sample-3",
    author: "박**",
    title: "부산 출발이라 편했어요",
    region: "동북아",
    ship: "Resorts World One",
    category: "동북아",
    content:
      "부산 출발이라 공항 이동 부담이 없어서 좋았고, 일본 기항지 관광도 알차서 만족했습니다.",
    date: "2026-03-15",
    rating: 5,
    views: 0,
    imageUrl: "/reviews/review-3.png",
  },
];

/** 메인 "여행을 다녀온 분들의 이야기" — 실제 후기(없으면 샘플) 상위 3개 */
export default function ReviewsLive() {
  const { reviews } = useReviews();
  const data = reviews.length > 0 ? reviews.slice(0, 3) : SAMPLE_REVIEWS;
  return <Reviews reviews={data} />;
}
