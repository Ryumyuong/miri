import Link from "next/link";

/** "크루즈 가이드 미리보기" — 4×2(8개) 카드 그리드. */

type Guide = { icon: string; title: string; desc: string; slug: string };

const GUIDES: Guide[] = [
  { icon: "ship", title: "크루즈 여행이란?", desc: "바다 위 호텔에서 떠나는 새로운 여행", slug: "about" },
  { icon: "suitcase", title: "승선 안내", desc: "체크인부터 객실 입실까지의 과정", slug: "embarkation" },
  { icon: "card", title: "선상 카드 안내", desc: "편리한 선상 결제 시스템", slug: "onboard-card" },
  { icon: "home", title: "객실 종류", desc: "내측·오션뷰·발코니·스위트 비교", slug: "cabins" },
  { icon: "dining", title: "선내 시설", desc: "레스토랑·수영장·엔터테인먼트", slug: "facilities" },
  { icon: "map", title: "기항지 관광", desc: "자유·선택 관광 이용 방법", slug: "shore-excursion" },
  { icon: "exit", title: "하선 안내", desc: "귀국 전 짐 정리부터 출국까지", slug: "disembarkation" },
  { icon: "question", title: "자주 묻는 질문", desc: "예약·결제·여권 관련 안내", slug: "faq" },
];

export default function CruiseGuide() {
  return (
    <section
      className="bg-white px-[max(16.534%,calc((100%_-_1920px)/2_+_250px))] pt-52 pb-64 max-[991px]:px-[5%] max-[991px]:pt-16 max-[991px]:pb-16"
      style={{ fontSize: "var(--font-base)" }}
    >
      {/* 헤더 */}
      <div className="mb-[5.5em] text-center max-[991px]:mb-8">
        <p className="text-[min(0.9779vw,18.7757px)] max-[991px]:text-[min(2.7412vw,16.4473px)] max-[501px]:text-[3.0628vw] font-bold tracking-[0.43em] text-[#DBBA5D]">
          CRUISE GUIDE
        </p>
        <h2 className="mt-[0.3em] text-[min(2.75vw,52.8px)] max-[991px]:text-[min(6.9551vw,41.7306px)] max-[501px]:text-[7.4vw] font-extrabold text-black">
          크루즈 가이드 미리보기
        </h2>
        <p className="mt-[0.3em] text-[min(1.3321vw,25.5763px)] max-[991px]:text-[min(3.4vw,20.4px)] max-[501px]:text-[3.772vw] font-medium text-[#242424]">
          처음 떠나는 크루즈도 어렵지 않게, 핵심만 정리했습니다.
        </p>
      </div>

      {/* 4×2 카드 그리드 */}
      <div className="grid w-full grid-cols-4 gap-[1.5em] max-[991px]:grid-cols-2 max-[501px]:grid-cols-1">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guide/${g.slug}`}
            className="group flex flex-col items-start gap-[0.9em] rounded-[0.6em] border border-black/10 p-[1.8em] transition duration-300 hover:-translate-y-1 hover:border-[#1E4D8B]/40 hover:bg-gradient-to-b hover:from-white hover:from-50% hover:to-[#1E4D8B]/10 hover:shadow-[0_20px_40px_-12px_rgba(11,42,74,0.35)] max-[501px]:flex-row max-[501px]:items-center max-[501px]:gap-[2em]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/icons/guide-grid/${g.icon}.png`} alt="" className="h-[2.8em] w-[2.8em] shrink-0 object-contain max-[501px]:h-[3.2em] max-[501px]:w-[3.2em]" />
            {/* 텍스트 묶음 — ≤500px: 이미지 오른쪽 빈공간 뒤 왼쪽 정렬(모든 카드 동일 위치), 세로 중앙 */}
            <div className="flex flex-1 flex-col items-start gap-[0.9em] max-[501px]:justify-center max-[501px]:gap-[0.4em]">
              <span className="mt-[0.4em] block text-[min(1.232vw,23.6544px)] max-[991px]:text-[min(3.4536vw,20.7214px)] max-[501px]:text-[3.8587vw] font-bold text-black max-[501px]:mt-0">{g.title}</span>
              <span className="block text-[min(0.8855vw,17.0016px)] max-[991px]:text-[min(2.4822vw,14.8932px)] max-[501px]:text-[2.7733vw] font-normal leading-relaxed text-black/60">{g.desc}</span>
              <span className="mt-auto pt-[0.3em] inline-flex items-center gap-[0.3em] text-[min(0.8085vw,15.5232px)] max-[991px]:text-[min(2.2664vw,13.5983px)] max-[501px]:text-[2.5322vw] font-semibold text-[#1E4D8B] opacity-0 transition group-hover:opacity-100 max-[501px]:hidden">
                자세히 보기 →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
