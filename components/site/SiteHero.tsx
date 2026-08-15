"use client";

import { Fragment, useEffect, useRef, useState, type TouchEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 미리크루즈 메인 히어로 — 배경 이미지 5개 캐러셀 + 슬라이드별 텍스트/버튼.
 *  · 6초마다 자동 전환(수동 조작 시 타이머 리셋)
 *  · 좌측 숫자(01~05)를 누르면 해당 슬라이드로 이동, 06은 긴 인트로 영상
 *  · 중앙 텍스트(THE PREMIUM CRUISE 등) + CTA 2버튼, 하단 검색바는 유지
 */

type Slide = {
  img: string;
  imgW: string; // 펼친 모바일(500~990px, 정사각) 배경
  imgM: string; // 접은 모바일(≤500px, 세로) 배경
  eyebrow: string;
  sub: string[]; // 흰색 서브 (모바일에서 줄바꿈)
  head?: string[]; // 골드 그라디언트 헤드라인 (2~5번 슬라이드)
  price?: boolean; // 1번 슬라이드: 월 49,500 원~
  desc: string[]; // 설명 (모바일에서 줄바꿈)
  descSep?: string; // 데스크톱에서 desc 줄 사이 구분자 (기본 공백)
};

const SLIDES: Slide[] = [
  {
    img: "/hero/slide-1.webp",
    imgW: "/hero/wide-1.webp",
    imgM: "/hero/mobile-1.webp",
    eyebrow: "THE PREMIUM CRUISE",
    sub: ["꿈꿔왔던 크루즈 여행,", "이제 현실로!"],
    price: true,
    desc: ["약 53만원 상당 혜택 포함", "항만세, 선내팁, 해외여행자 보험 (1억원) 포함"],
    descSep: "  -  ",
  },
  {
    img: "/hero/slide-2.webp",
    imgW: "/hero/wide-2.webp",
    imgM: "/hero/mobile-2.webp",
    eyebrow: "ALL-INCLUSIVE TOUR",
    sub: ["부담 없는 여행"],
    head: ["NO옵션,", "NO쇼핑"],
    desc: ["항공, 숙박, 전 일정 식사, 기항지 관광 입장료,", "가이드/기사/인솔자 경비까지 모두 포함"],
  },
  {
    img: "/hero/slide-3.webp",
    imgW: "/hero/wide-3.webp",
    imgM: "/hero/mobile-3.webp",
    eyebrow: "THE PREMIUM CRUISE",
    sub: ["안심 여행 서비스"],
    head: ["전문 인솔자", "동행"],
    desc: ["전문 인솔자가 전 일정 동행하며", "기항지 안내 및 전용차량 행사를 진행"],
  },
  {
    img: "/hero/slide-4.webp",
    imgW: "/hero/wide-4.webp",
    imgM: "/hero/mobile-4.webp",
    eyebrow: "PREMIUM DINING",
    sub: ["프리미엄 다이닝"],
    head: ["정찬 &", "뷔페 레스토랑"],
    desc: ["바다 위에서 즐기는 셰프들의 풀코스 정찬"],
  },
  {
    img: "/hero/slide-5.webp",
    imgW: "/hero/wide-5.webp",
    imgM: "/hero/mobile-5.webp",
    eyebrow: "ONBOARD FUN",
    sub: ["다채로운 엔터테인먼트"],
    head: ["선내 부대시설", "이용"],
    desc: ["크루즈 기본 부대시설 및 무료공연", "(일부 시설 제외)"],
  },
];

/** 히어로 영상 — hero-2~6이 앞으로 오고 긴 인트로(hero-1)가 맨 뒤(06번)로 이동.
 *  [0..4] = SLIDES와 1:1 대응(각 5초, 문구 그대로 따라옴), [5] = 인트로(약 54초, 텍스트 없음) */
const VIDEOS = [
  "/hero/hero-2.mp4",
  "/hero/hero-3.mp4",
  "/hero/hero-4.mp4",
  "/hero/hero-5.mp4",
  "/hero/hero-6.mp4",
  "/hero/hero-1.mp4",
];
/** 인트로(긴 영상) 위치 = 마지막 칸 */
const INTRO_INDEX = VIDEOS.length - 1;

/** 데스크톱은 한 줄(sep로 연결), 모바일은 배열 항목마다 줄바꿈 */
function Lines({ parts, sep = " " }: { parts: string[]; sep?: string }) {
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              <span className="max-[991px]:hidden">{sep}</span>
              <br className="hidden max-[991px]:block" />
            </>
          )}
          {p}
        </Fragment>
      ))}
    </>
  );
}

const GOLD_TEXT: React.CSSProperties = {
  backgroundImage: "linear-gradient(180deg, #FFE4AC 28.18%, #BC7E39 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  filter: "drop-shadow(0px 4px 12px rgba(0,0,0,0.77))",
};

const CONSULT_URL = "https://pf.kakao.com/_xolGWn/chat";

const REGIONS = ["전체", "유럽", "미주·알래스카", "중동", "동남아/동북아"];
const regionValue = (label: string) => (label === "전체" ? "" : label);

export default function SiteHero() {
  const [slide, setSlide] = useState(0);
  const router = useRouter();
  const [region, setRegion] = useState("전체");
  const [date, setDate] = useState("");
  const [people, setPeople] = useState(2);
  const [regionOpen, setRegionOpen] = useState(false);

  // 01~05번(hero-2~6)이 문구와 함께 순서대로 돌고, 마지막 06번에서 긴 인트로(hero-1)가 재생된다.
  // 인트로 재생 중에는 텍스트·인덱스를 숨기고, 끝나면 다시 01번으로 돌아간다.
  const [intro, setIntro] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeVideo = intro ? INTRO_INDEX : slide;

  // 모바일(≤990) 여부 — 모바일에선 용량이 큰 인트로(hero-1)를 재생/다운로드하지 않는다.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 990px)");
    const on = () => setIsMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // 모바일이면 인트로(06번)를 건너뛰고 첫 슬라이드로 되돌린다
  useEffect(() => {
    if (isMobile && intro) {
      setIntro(false);
      setSlide(0);
    }
  }, [isMobile, intro]);

  // 활성 영상만 처음부터 재생, 나머지는 정지 + 다음 영상 미리 로드
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      // 모바일에선 인트로(06번, 대용량)는 절대 재생하지 않음
      if (i === activeVideo && !(isMobile && i === INTRO_INDEX)) {
        v.currentTime = 0;
        void v.play().catch(() => {});
      } else if (!v.paused) {
        v.pause();
      }
    });
    // 다음 순서: 인트로 뒤 → 첫 슬라이드 / 마지막 슬라이드 뒤 → 인트로(모바일은 첫 슬라이드)
    const next = intro
      ? 0
      : slide < SLIDES.length - 1
        ? slide + 1
        : isMobile
          ? 0
          : INTRO_INDEX;
    const nv = videoRefs.current[next];
    if (nv && nv.preload !== "auto") {
      nv.preload = "auto";
      nv.load();
    }
  }, [activeVideo, intro, slide, isMobile]);

  const goTo = (i: number) => {
    setIntro(false); // 수동 조작 시 인트로 건너뜀
    setSlide(i);
  };
  const goPrev = () => goTo((slide - 1 + SLIDES.length) % SLIDES.length);
  const goNext = () => goTo((slide + 1) % SLIDES.length);
  const goIntro = () => setIntro(true); // 06번 = 인트로(긴 영상)

  // 모바일: 히어로 좌우 스와이프로 슬라이드 이동 (왼쪽 스와이프=다음, 오른쪽=이전)
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: TouchEvent<HTMLElement>) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent<HTMLElement>) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return; // 탭·미세 이동 무시
    if (dx < 0) goNext();
    else goPrev();
  };

  // 영상 재생 종료 처리 — 인트로(06) 끝 → 01번으로, 마지막 슬라이드(05) 끝 → 인트로로 (1~6 무한 루프)
  const onVideoEnded = (videoIdx: number) => {
    if (videoIdx === INTRO_INDEX) {
      setSlide(0);
      setIntro(false);
    } else if (videoIdx === SLIDES.length - 1) {
      // PC: 마지막 슬라이드 끝 → 긴 영상(hero-1) 재생 / 모바일: 인트로 생략, 첫 슬라이드로 순환
      if (isMobile) goNext();
      else setIntro(true);
    } else {
      goNext();
    }
  };

  // 텍스트는 겹치지 않게: 현재 글자 완전히 사라진 뒤(fade-out) 다음 글자 등장(fade-in)
  const [textSlide, setTextSlide] = useState(0);
  const [textVisible, setTextVisible] = useState(false); // 인트로 동안 숨김
  useEffect(() => {
    if (intro) {
      setTextVisible(false);
      return;
    }
    if (slide === textSlide) {
      setTextVisible(true);
      return;
    }
    setTextVisible(false); // fade-out
    const t = setTimeout(() => {
      setTextSlide(slide); // 내용 교체
      setTextVisible(true); // fade-in
    }, 450);
    return () => clearTimeout(t);
  }, [slide, textSlide, intro]);

  const search = () => {
    const params = new URLSearchParams();
    const rv = regionValue(region);
    if (rv) params.set("region", rv);
    if (date) params.set("from", date);
    if (people) params.set("people", String(people));
    const qs = params.toString();
    router.push(qs ? `/cruises?${qs}` : "/cruises");
  };

  return (
    <section
      className="relative aspect-video w-full overflow-visible bg-black text-white max-[501px]:aspect-[1236/1878]"
      style={{ fontSize: "var(--font-base)" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── 배경 영상 6개를 겹쳐두고 활성 1개만 재생(크로스페이드) ──
           [0~4] = hero-2~6(슬라이드 문구와 1:1), [5] = 인트로 hero-1(텍스트 없음, 1회) */}
      {VIDEOS.map((src, i) => (
        <video
          key={i}
          ref={(el) => {
            videoRefs.current[i] = el;
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            i === activeVideo ? "opacity-100" : "opacity-0"
          }`}
          src={src}
          poster={i === INTRO_INDEX ? SLIDES[0].img : SLIDES[i].img}
          autoPlay={i === 0}
          muted
          playsInline
          preload={i === 0 ? "auto" : "none"}
          onEnded={() => onVideoEnded(i)}
        />
      ))}
      {/* 텍스트 가독성용 오버레이 — 인트로(06번 hero-1, 텍스트 없음) 재생 중엔 숨김 */}
      {!intro && <div className="absolute inset-0 bg-black/20 transition-opacity duration-500" />}

      {/* ── 중앙 텍스트 + CTA (겹침 없이 완전히 사라진 뒤 다음 글자 등장) ── */}
      {(() => {
        const s = SLIDES[textSlide];
        return (
        <div
          className={`absolute inset-0 z-[5] flex flex-col items-center justify-center px-[max(8%,calc((100%_-_1920px)/2_+_120.96px))] pb-[3.5em] text-center transition-opacity duration-[450ms] max-[991px]:pb-0 ${
            textVisible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <p
            className="text-[min(0.9375vw,18px)] max-[991px]:text-[min(2.9199vw,17.5194px)] font-bold text-[#DBBA5D] max-[501px]:text-[3.1319vw]"
            style={{ letterSpacing: "0.35em" }}
          >
            {s.eyebrow}
          </p>
          <h2 className="mt-[1.1em] text-[min(2.3328vw,44.7898px)] font-bold leading-[1.15] text-white break-keep max-[991px]:mt-[0.7em] max-[991px]:text-[min(5.5161vw,33.0966px)] max-[501px]:text-[6.2635vw]">
            <Lines parts={s.sub} />
          </h2>

          {s.price ? (
            <p className="mt-[0.9em] flex items-end justify-center gap-[0.8em]">
              <span className="text-[min(1.9271vw,37.0003px)] font-bold text-[#F3D297] max-[991px]:text-[min(3.5974vw,21.5844px)] max-[501px]:text-[6.4802vw]">월</span>
              <span
                className="text-[min(4.5016vw,86.4307px)] font-bold leading-none max-[991px]:text-[min(8.1542vw,48.9252px)] max-[501px]:text-[15.1371vw]"
                style={{ ...GOLD_TEXT, fontFamily: '"Noto Serif JP", serif' }}
              >
                49,500
              </span>
              <span className="text-[min(1.9271vw,37.0003px)] font-bold text-[#F3D297] max-[991px]:text-[min(3.5974vw,21.5844px)] max-[501px]:text-[6.4802vw]">원~</span>
            </p>
          ) : (
            <p
              className="mt-[0.15em] text-[min(4.5016vw,86.4307px)] font-bold leading-none break-keep max-[991px]:text-[min(8.1542vw,48.9252px)] max-[991px]:leading-[1.15] max-[501px]:text-[12.5vw]"
              style={GOLD_TEXT}
            >
              <Lines parts={s.head!} />
            </p>
          )}

          {/* 501~990px: 버튼 가로(좌우) 전체폭 · ≤500px: 세로(위아래) */}
          <div className="mt-[3.2em] flex w-full max-w-[30em] items-center justify-center gap-[1em] max-[991px]:mt-[2em] max-[991px]:max-w-none max-[991px]:gap-[0.7em] max-[501px]:w-[70%] max-[501px]:flex-col max-[501px]:items-stretch">
            <Link
              href="/cruises"
              className="flex flex-1 items-center whitespace-nowrap bg-white py-[0.5em] pl-[1.6em] pr-[0.6em] text-[min(1.1458vw,21.9994px)] font-bold text-[#113667] transition hover:brightness-95 max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.9148vw]"
              style={{ borderRadius: "2.9424em" }}
            >
              <span className="flex-1 text-center">출항 일정 보기</span>
              <span className="ml-[0.5em] inline-flex h-[1.7em] w-[1.7em] shrink-0 items-center justify-center rounded-full bg-[#113667]">
                <svg viewBox="0 0 24 24" className="h-[0.95em] w-[0.95em]" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
            <a
              href={CONSULT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center whitespace-nowrap bg-[#113667] px-[1.5em] py-[0.62em] text-[min(1.1458vw,21.9994px)] font-bold text-white transition hover:brightness-125 max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.9148vw]"
              style={{ borderRadius: "2.9424em" }}
            >
              상담문의
            </a>
          </div>
        </div>
        );
      })()}

      {/* ── 좌측 슬라이드 인덱스 (숫자 클릭 → 해당 슬라이드) ── */}
      <div
        className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 flex-col items-start gap-[0.9em] text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] max-[991px]:hidden"
      >
        <button onClick={goPrev} aria-label="이전" className="mb-[1.4em] ml-[4.4em] opacity-100 transition hover:opacity-70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/arrow-up.png" alt="" className="h-[1em] w-auto object-contain" />
        </button>
        {/* 01~05 = 슬라이드 1~5(hero-2~6), 06 = 인트로(hero-1) */}
        {VIDEOS.map((_, i) => {
          const on = i === INTRO_INDEX ? intro : !intro && slide === i;
          return (
          <button
            key={i}
            onClick={i === INTRO_INDEX ? goIntro : () => goTo(i)}
            className={`flex items-center gap-[0.6em] transition ${
              on ? "opacity-100" : "opacity-50 hover:opacity-80"
            }`}
          >
            <span
              className={`block h-[0.13em] w-[3.4em] transition-all ${
                on ? "bg-white" : "bg-transparent"
              }`}
            />
            <span
              className="text-[1.6em] font-normal"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          </button>
          );
        })}
        <button onClick={goNext} aria-label="다음" className="mt-[1.4em] ml-[4.4em] opacity-100 transition hover:opacity-70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/arrow-down.png" alt="" className="h-[1em] w-auto object-contain" />
        </button>
      </div>

      {/* ── 검색 바 (1·2섹션 사이 하단 오버랩) ──────────── */}
      <div className="absolute inset-x-0 -bottom-[3em] z-20 translate-y-1/2 px-[max(11.574%,calc((100%_-_1920px)/2_+_175px))] max-[991px]:-bottom-[7em]">
        <div className="flex w-full items-center gap-[2.2em] rounded-none bg-white px-[2.2em] py-[1.6em] text-navy shadow-[0px_4.26px_64.71px_0px_rgba(0,0,0,0.10)] max-[991px]:grid max-[991px]:grid-cols-2 max-[991px]:items-end max-[991px]:gap-x-[1.5em] max-[991px]:gap-y-[1.4em]">
          {/* 희망지역 — 칩 선택 드롭다운 */}
          <SearchField icon="/icons/region.png" label="희망지역">
            <div className="relative">
              <button
                type="button"
                onClick={() => setRegionOpen((v) => !v)}
                style={{ fontFamily: "Inter, var(--font-sans)", fontWeight: 600 }}
                className="flex w-full items-center justify-between border-b border-slate-300 pb-[0.5em] text-left text-[min(0.9966vw,19.1347px)] max-[991px]:text-[min(3.1041vw,18.6246px)] max-[501px]:text-[3.7698vw] text-[#01033E]"
              >
                <span>{region}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/caret-down.png" alt="" className="h-[0.35em] w-auto object-contain" />
              </button>
              {regionOpen && (
                <div className="absolute left-0 top-[calc(100%+0.5em)] z-30 grid w-[18em] grid-cols-2 gap-[0.5em] rounded-[0.5em] border border-slate-200 bg-white p-[0.8em] shadow-xl">
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRegion(r);
                        setRegionOpen(false);
                      }}
                      className={`rounded-[0.4em] px-[0.8em] py-[0.6em] text-[min(0.7315vw,14.0448px)] max-[991px]:text-[min(2.2784vw,13.6704px)] max-[501px]:text-[2.767vw] font-semibold transition ${
                        region === r ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </SearchField>

          {/* 희망 출발일 — 달력 (미선택 시 '전체') */}
          <SearchField icon="/icons/date.png" label="희망 출발일">
            <div className="relative">
              <div
                style={{ fontFamily: "Inter, var(--font-sans)", fontWeight: 600 }}
                className="flex items-center justify-between border-b border-slate-300 pb-[0.5em] text-[min(0.9966vw,19.1347px)] max-[991px]:text-[min(3.1041vw,18.6246px)] max-[501px]:text-[3.7698vw] text-[#01033E]"
              >
                <span>{date || "전체"}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/caret-down.png" alt="" className="h-[0.35em] w-auto object-contain" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              {date && (
                <button
                  type="button"
                  onClick={() => setDate("")}
                  className="absolute -top-[1.6em] right-0 text-[min(0.6545vw,12.5664px)] max-[991px]:text-[min(2.0386vw,12.2316px)] max-[501px]:text-[2.4757vw] font-medium text-slate-400 hover:text-brand"
                >
                  전체
                </button>
              )}
            </div>
          </SearchField>

          {/* 여행 인원 — 1~100명 선택 */}
          <SearchField icon="/icons/people.png" label="여행 인원">
            <div className="relative">
              <select
                value={people}
                onChange={(e) => setPeople(+e.target.value)}
                style={{ fontFamily: "Inter, var(--font-sans)", fontWeight: 600 }}
                className="w-full appearance-none border-b border-slate-300 bg-transparent pb-[0.5em] pr-[1.2em] text-[min(0.9966vw,19.1347px)] max-[991px]:text-[min(3.1041vw,18.6246px)] max-[501px]:text-[3.7698vw] text-[#01033E] outline-none"
              >
                {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}인</option>
                ))}
              </select>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/caret-down.png" alt="" className="pointer-events-none absolute right-0 top-1/2 h-[0.35em] w-auto -translate-y-1/2 object-contain" />
            </div>
          </SearchField>

          <button
            onClick={search}
            className="ml-[2.5em] flex shrink-0 items-center justify-center gap-[0.5em] whitespace-nowrap rounded-none bg-[#113667] px-[2.6em] py-[0.65em] text-[min(1.2898vw,24.7642px)] font-bold text-white transition hover:brightness-125 max-[991px]:ml-0 max-[991px]:w-full max-[991px]:self-stretch max-[991px]:px-[1em] max-[991px]:py-[0.7em] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/search.png" alt="" className="h-[1.1em] w-[1.1em] object-contain" />
            일정검색
          </button>
        </div>
      </div>
    </section>
  );
}

function SearchField({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center max-[991px]:w-full">
      <p className="mb-[0.5em] flex items-center gap-[0.4em] text-[min(0.9383vw,18.0154px)] max-[991px]:text-[min(2.9226vw,17.5356px)] max-[501px]:text-[3.5493vw] font-medium text-[#5A6B7E]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt="" className="h-[1.3em] w-[1.3em] object-contain" />
        {label}
      </p>
      {children}
    </div>
  );
}
