"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useInView } from "@/lib/useInView";

/**
 * "고객센터" — 4개 채널 카드.
 *  기본: 회색 테두리.  hover: 파란 테두리 + 하단 액션 바 슬라이드 인 (멘트는 카드별로 다름).
 */

type Channel = {
  icon: "phone" | "kakao" | "faq" | "booking";
  title: string;
  primary: string;
  sub: string;
  action: string;
  href: string;
};

const CHANNELS: Channel[] = [
  { icon: "phone", title: "전화상담", primary: "1644-8868", sub: "평일 09:00~18:00", action: "전화연결", href: "tel:1644-8868" },
  { icon: "kakao", title: "카카오톡 상담", primary: "@미리크루즈", sub: "빠른 응답 가능", action: "카톡 상담", href: "https://pf.kakao.com/_xolGWn/chat" },
  { icon: "faq", title: "자주묻는질문", primary: "예약 · 결제 · 여권", sub: "주요안내사항", action: "FAQ 보기", href: "/faq" },
  { icon: "booking", title: "예약조회", primary: "가예약 확인", sub: "진행상태조회", action: "조회하기", href: "/reservation" },
];

const channelIconSrc: Record<Channel["icon"], string> = {
  phone: "/icons/phone.png",
  kakao: "/icons/kakao.png",
  faq: "/icons/faq.png",
  booking: "/icons/booking.png",
};

function ChannelIcon({ name }: { name: Channel["icon"] }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={channelIconSrc[name]} alt="" className={`${name === "kakao" ? "h-[1.6em] w-[1.6em]" : "h-[1.3em] w-[1.3em]"} object-contain`} />
  );
}

const CARD_CLASS =
  "group relative flex aspect-square flex-col items-center justify-center gap-[0.5em] overflow-hidden rounded-[0.4em] border-[0.82px] border-[#C6C6C6] px-[2.8em] pb-[3em] text-center transition hover:border-[1.98px] hover:border-[#1E4D8B] max-[991px]:border-[1.98px] max-[991px]:border-[#1E4D8B] max-[501px]:aspect-[4/5]";

function CardInner({ c }: { c: Channel }) {
  return (
    <>
      <ChannelIcon name={c.icon} />
      <div className="mt-[0.3em] flex flex-col items-center gap-[0.1em]">
        <p className="text-[min(1.155vw,22.176px)] max-[991px]:text-[min(3.5974vw,21.5844px)] max-[501px]:text-[3.4601vw] font-bold text-[#1E4D8B]">{c.title}</p>
        <p className={`${c.icon === "phone" ? "text-[min(1.309vw,25.1328px)] max-[991px]:text-[min(4.0771vw,24.4626px)] max-[501px]:text-[3.9215vw]" : "text-[1.15em]"} font-normal text-[#030303]`}>{c.primary}</p>
      </div>
      <span className="my-[0.6em] block h-[0.82px] w-[2.2em] bg-black/20" />
      <p className="text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[2.5375vw] font-light text-black/50">{c.sub}</p>
    </>
  );
}

function ChannelCard({ c, isMobile }: { c: Channel; isMobile: boolean }) {
  const [open, setOpen] = useState(false);
  const isHttp = c.href.startsWith("http");
  const linkProps = {
    href: c.href,
    target: isHttp ? "_blank" : undefined,
    rel: isHttp ? "noreferrer" : undefined,
  };
  const bar = (translate: string) => (
    <span className={`absolute inset-x-0 bottom-0 bg-navy py-[0.9em] text-[min(0.6319vw,12.1325px)] max-[991px]:text-[min(1.968vw,11.808px)] max-[501px]:text-[2.3901vw] font-bold text-white transition-transform duration-300 ${translate}`}>
      {c.action} →
    </span>
  );

  // 모바일: 첫 탭 → 하단 바 노출, 바 탭 → 링크 이동
  if (isMobile) {
    return (
      <div className={CARD_CLASS} onClick={() => setOpen(true)}>
        <CardInner c={c} />
        {open ? (
          <Link {...linkProps} className="absolute inset-x-0 bottom-0 bg-navy py-[0.9em] text-[min(0.6319vw,12.1325px)] max-[991px]:text-[min(1.968vw,11.808px)] max-[501px]:text-[2.3901vw] font-bold text-white">
            {c.action} →
          </Link>
        ) : (
          bar("translate-y-full")
        )}
      </div>
    );
  }

  // 데스크톱: 카드 전체 링크, hover 시 하단 바 슬라이드 인
  return (
    <Link {...linkProps} className={CARD_CLASS}>
      <CardInner c={c} />
      {bar("translate-y-full group-hover:translate-y-0")}
    </Link>
  );
}

export default function SupportCenter() {
  const grid = useInView();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 990px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return (
    <section
      className="bg-white px-[max(16.534%,calc((100%_-_1920px)/2_+_250px))] py-52 max-[991px]:px-[6%] max-[991px]:py-16"
      style={{ fontSize: "var(--font-base)" }}
    >
      {/* 헤더 */}
      <div className="mb-[3em] text-center">
        <p className="text-[min(1.001vw,19.2192px)] max-[991px]:text-[min(3.1178vw,18.7068px)] max-[501px]:text-[3.7864vw] font-bold tracking-[0.43em] text-[#DBBA5D]">
          SUPPORT
        </p>
        <h2 className="mt-[0.25em] text-[min(2.75vw,52.8px)] max-[991px]:text-[min(6.9551vw,41.7306px)] max-[501px]:text-[7.4vw] font-extrabold text-black">고객센터</h2>
      </div>

      {/* 카드 — 스크롤 시 1개씩 아래에서 위로 등장 */}
      <div ref={grid.ref} className="grid w-full grid-cols-4 gap-[1.8em] max-[991px]:grid-cols-2">
        {CHANNELS.map((c, i) => (
          <div
            key={c.title}
            className={`transition-all duration-500 ease-out ${grid.inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
            style={{ transitionDelay: grid.inView ? `${i * 130}ms` : "0ms" }}
          >
            <ChannelCard c={c} isMobile={isMobile} />
          </div>
        ))}
      </div>
    </section>
  );
}
