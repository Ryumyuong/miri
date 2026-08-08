"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import ContactCta from "@/components/site/ContactCta";
import { guideTopicBySlug, type GuideSection } from "@/lib/guide-content";

export default function GuideDetailPage() {
  const params = useParams();
  const slug = String(params.slug);
  const topic = guideTopicBySlug(slug);

  if (!topic) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader solid />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 pt-40 pb-40 text-center" style={{ fontSize: "var(--font-base)" }}>
          <p className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] text-slate-400">가이드를 찾을 수 없습니다.</p>
          <Link href="/guide" className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-brand hover:underline">
            ← 가이드 목록
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader solid />

      <main className="flex-1" style={{ fontSize: "var(--font-base)" }}>
        {/* 배너 헤더 */}
        <section
          className="relative w-full bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(11,42,74,0.55), rgba(11,42,74,0.55)), url('${topic.image}')`,
          }}
        >
          <div className="relative flex flex-col items-center justify-center px-[max(8%,calc((100%_-_1920px)/2_+_120.96px))] pt-[9em] pb-[3.5em] text-center text-white max-[991px]:pt-[10em] max-[991px]:pb-[5.5em]">
            <h1 className="text-[min(2.1323vw,40.9402px)] max-[991px]:text-[min(6.6414vw,39.8484px)] font-bold max-[501px]:text-[5.8252vw]">{topic.title}</h1>
            <p className="mt-2 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] font-medium text-white/85">{topic.subtitle}</p>
          </div>
          {/* 모바일: 배너 안 고정 버튼 */}
          <Link
            href="/guide"
            className="absolute left-[4%] top-[6em] inline-flex items-center gap-[0.4em] rounded-full border border-white/50 px-[1.2em] py-[0.45em] text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.0582vw] font-medium text-white backdrop-blur-sm transition hover:bg-white/10 min-[991px]:hidden"
          >
            ← 가이드 목록
          </Link>
        </section>

        {/* PC: 스크롤을 따라 카드 바로 왼쪽에 붙어 다니는 목록 버튼 */}
        <Link
          href="/guide"
          className="fixed right-[calc(100%_-_max(10.7143%,calc((100%_-_1920px)/2_+_162px))_+_0.8em)] top-[30%] z-40 hidden -translate-y-1/2 items-center gap-[0.4em] whitespace-nowrap rounded-full bg-[#1E4D8B] px-[1.2em] py-[0.55em] text-[min(0.8085vw,15.5232px)] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(11,42,74,0.4)] transition hover:brightness-110 min-[991px]:inline-flex"
        >
          ← 가이드 목록
        </Link>

        {/* 섹션 */}
        <div className="w-full px-[max(10.7143%,calc((100%_-_1920px)/2_+_162px))] py-[6em] max-[991px]:px-[5%] max-[991px]:py-[3em]">
          <div className="flex flex-col gap-14 max-[991px]:gap-8">
            {topic.sections.map((s, i) => (
              <SectionRow key={s.title} n={i + 1} section={s} />
            ))}
          </div>
        </div>
      </main>

      <ContactCta heading="더 궁금한 점이 있으신가요?" actionLabel="다른 가이드 보기" actionHref="/guide" />
      <SiteFooter />
    </div>
  );
}

function NumberBadge({ n }: { n: number }) {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#0B2A4A] text-[min(0.7292vw,14.0006px)] max-[991px]:text-[min(2.2712vw,13.6272px)] max-[501px]:text-[2.7582vw] font-bold text-white">
      {n}
    </span>
  );
}

function SectionRow({ n, section }: { n: number; section: GuideSection }) {
  // 이미지가 있으면 좌측 텍스트 카드 + 우측 이미지, 없으면 전체폭 텍스트 카드
  if (!section.image) {
    return (
      <div className="rounded-[12px] border border-[#F3F4F6] bg-white p-7 max-[501px]:p-5">
        <div className="flex items-center gap-3">
          <NumberBadge n={n} />
          <h2 className="text-[min(1.5625vw,30px)] max-[991px]:text-[min(4.8666vw,29.1996px)] max-[501px]:text-[5.9102vw] font-bold text-[#1E4D8B]">{section.title}</h2>
        </div>
        <p className="mt-3 pl-11 text-[min(0.9376vw,18.0019px)] max-[991px]:text-[min(2.9202vw,17.5212px)] max-[501px]:text-[3.5464vw] font-normal leading-[1.8] text-[#6A7282] max-[501px]:pl-0">{section.body}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_1.15fr] items-stretch overflow-hidden rounded-[12px] border border-[#D9D9D9] bg-white max-[991px]:grid-cols-1">
      <div className="flex flex-col justify-center py-14 pr-24 pl-24 max-[991px]:py-9 max-[991px]:px-9 max-[501px]:p-6">
        <div className="flex items-center gap-3">
          <NumberBadge n={n} />
          <h2 className="text-[min(1.5625vw,30px)] max-[991px]:text-[min(4.8666vw,29.1996px)] max-[501px]:text-[5.9102vw] font-bold text-[#1E4D8B]">{section.title}</h2>
        </div>
        <p className="mt-4 min-h-[7.4em] text-[min(0.9376vw,18.0019px)] max-[991px]:text-[min(2.9202vw,17.5212px)] max-[501px]:text-[3.5464vw] font-normal leading-[1.85] text-[#6A7282] max-[991px]:min-h-0">{section.body}</p>
      </div>
      <div className="relative max-[991px]:aspect-[16/9]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={section.image} alt={section.title} className="absolute inset-0 h-full w-full object-cover" />
        {/* 왼쪽을 흰색으로 페이드 → 텍스트 영역과 자연스럽게 연결 (데스크톱) */}
        <div
          className="absolute inset-0 max-[991px]:hidden"
          style={{ background: "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0) 15%)" }}
        />
      </div>
    </div>
  );
}
