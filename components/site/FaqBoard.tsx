"use client";

import { useState } from "react";

type Faq = { category: string; q: string; a: string };

const CATEGORIES = ["전체", "예약/결제", "여권/비자", "선박/객실", "취소/환불", "기항지 관광"];

const FAQS: Faq[] = [
  { category: "예약/결제", q: "예약은 어떻게 하나요?", a: "원하시는 일정의 상세 페이지에서 가예약을 신청하시면, 담당 상담사가 연락드려 예약을 확정해 드립니다." },
  { category: "예약/결제", q: "여권 정보는 언제까지 제출해야 하나요?", a: "출발 60일 전까지 여권 사본 제출을 권장하며, 늦어도 출발 30일 전까지는 제출해 주셔야 합니다." },
  { category: "예약/결제", q: "계약금은 언제 납부하나요?", a: "출발 확정 안내 시점에 계약금이 발생하며, 안내에 따라 납부해 주시면 예약이 확정됩니다." },
  { category: "여권/비자", q: "여권이 없어도 예약할 수 있나요?", a: "예약은 가능하나, 출발 전까지 유효기간이 충분한 여권을 반드시 준비하셔야 합니다." },
  { category: "여권/비자", q: "비자가 필요한가요?", a: "방문 국가에 따라 비자가 필요할 수 있으며, 예약 시 담당 상담사가 상세히 안내해 드립니다." },
  { category: "선박/객실", q: "객실 등급의 차이는 무엇인가요?", a: "내부, 오션뷰, 발코니, 스위트 객실로 나뉘며 전망과 공간, 제공 서비스에서 차이가 있습니다." },
  { category: "선박/객실", q: "선상에서 와이파이를 사용할 수 있나요?", a: "선내 와이파이 패키지를 구매하시면 이용 가능하며, 속도와 요금은 선사별로 상이합니다." },
  { category: "취소/환불", q: "예약 취소 시 환불이 가능한가요?", a: "취소 시점에 따라 취소료가 부과되며, 해외여행 특별약관 규정에 따라 환불 처리됩니다." },
  { category: "기항지 관광", q: "기항지에서 자유 관광이 가능한가요?", a: "네, 기항 시간 내 자유롭게 관광하실 수 있습니다. 단, 출항 전 승선 시간은 반드시 준수해야 합니다." },
  { category: "기항지 관광", q: "선택 관광 비용은 어떻게 되나요?", a: "선택 관광은 별도 비용이며, 현지에서 또는 출발 전 사전 예약으로 신청하실 수 있습니다." },
];

export default function FaqBoard() {
  const [cat, setCat] = useState("전체");
  const [open, setOpen] = useState<string | null>(null);

  const list = FAQS.filter((f) => cat === "전체" || f.category === cat);

  return (
    <div className="mx-auto w-full max-w-3xl px-5" style={{ fontSize: "var(--font-base)" }}>
      {/* 카테고리 칩 */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-none px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-medium transition ${
              cat === c
                ? "bg-[#1E4D8B] text-white"
                : "border-t border-[#0B2A4A]/10 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 아코디언 */}
      <div className="flex flex-col gap-3">
        {list.map((f) => {
          const key = f.q;
          const on = open === key;
          return (
            <div key={key} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button
                onClick={() => setOpen(on ? null : key)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left"
              >
                <span className="flex-1">
                  <span className="block text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] text-slate-400">{f.category}</span>
                  <span className="mt-0.5 block text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-navy">{f.q}</span>
                </span>
                <span className="text-slate-400">{on ? "▲" : "▼"}</span>
              </button>
              {on && (
                <p className="border-t border-slate-100 px-5 py-4 text-[min(0.8085vw,15.5232px)] max-[991px]:text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.0582vw] leading-relaxed text-slate-500">
                  {f.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
