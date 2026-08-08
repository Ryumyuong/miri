"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useInView } from "@/lib/useInView";

/**
 * "내게 맞는 크루즈 찾기" — 희망지역 / 희망 출발일 / 여행 인원을 순서대로 선택하면
 *  일정검색과 동일한 필터(region·from·people)로 /cruises 로 이동한다.
 */

type Opt = { label: string; value: string };

const REGION_OPTS: Opt[] = [
  { label: "상관없음", value: "" },
  { label: "유럽", value: "유럽" },
  { label: "미주·알래스카", value: "미주·알래스카" },
  { label: "중동", value: "중동" },
  { label: "동남아/동북아", value: "동남아/동북아" },
];

const PEOPLE_OPTS: Opt[] = [
  { label: "1인", value: "1" },
  { label: "2인", value: "2" },
  { label: "3인", value: "3" },
  { label: "4인 이상", value: "4" },
];

export default function CruiseFinder() {
  const finder = useInView<HTMLElement>();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([null, null, null]);
  const [monthOpts, setMonthOpts] = useState<Opt[]>([{ label: "상관없음", value: "" }]);

  // 출발 월 옵션은 현재 시점 기준으로 생성 (하이드레이션 불일치 방지 위해 클라이언트에서)
  useEffect(() => {
    const now = new Date();
    const opts: Opt[] = [{ label: "상관없음", value: "" }];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      opts.push({ label: `${String(y).slice(2)}년 ${m}월`, value: `${y}-${String(m).padStart(2, "0")}` });
    }
    setMonthOpts(opts);
  }, []);

  const questions: { title: [string, string]; options: Opt[] }[] = [
    { title: ["희망 지역을", "선택해주세요"], options: REGION_OPTS },
    { title: ["희망 출발일을", "선택해주세요"], options: monthOpts },
    { title: ["여행 인원을", "선택해주세요"], options: PEOPLE_OPTS },
  ];

  const total = questions.length;
  const cur = questions[step];
  const selected = answers[step];

  const choose = (value: string) =>
    setAnswers((prev) => prev.map((a, i) => (i === step ? value : a)));

  const submit = () => {
    const params = new URLSearchParams();
    const [region, from, people] = answers;
    if (region) params.set("region", region);
    if (from) params.set("from", `${from}-01`);
    if (people) params.set("people", people);
    const qs = params.toString();
    router.push(qs ? `/cruises?${qs}` : "/cruises");
  };

  const next = () => {
    if (step < total - 1) setStep((s) => s + 1);
    else submit();
  };
  const prev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <section
      ref={finder.ref}
      className="relative overflow-hidden bg-navy bg-cover bg-center"
      style={{
        fontSize: "calc(var(--font-base) * 0.9)",
        backgroundImage: "url('/finder-bg.png')",
      }}
    >
      <div className="flex w-full items-center gap-[3em] px-[max(16.534%,calc((100%_-_1920px)/2_+_250px))] py-[20em] max-[991px]:flex-col max-[991px]:gap-[2.5em] max-[991px]:px-[6%] max-[991px]:py-[7em]">
        {/* 좌측 카피 — 왼쪽에서 날아옴 */}
        <div
          className={`flex-1 text-[min(1.001vw,19.2192px)] text-white transition-all duration-700 ease-out max-[991px]:text-center max-[991px]:text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.0582vw] ${
            finder.inView ? "translate-x-0 opacity-100" : "-translate-x-20 opacity-0"
          }`}
        >
          <div className="mb-[1.5em] flex max-[991px]:justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/finder.png" alt="" className="h-[5em] w-auto object-contain" />
          </div>
          <h2 className="text-[min(2.75vw,52.8px)] max-[991px]:text-[min(6.9551vw,41.7306px)] max-[501px]:text-[7.4vw] font-extrabold leading-[1.2]">
            <span className="font-light text-white/85">내게 맞는</span>
            <br />
            크루즈 찾기
          </h2>
          <div className="my-[1.3em] h-[2.5em] w-px bg-white/40 max-[991px]:mx-auto" />
          <p className="text-[1.4286em] font-medium leading-[1.8] text-white">
            몇 가지 선택만으로 고객님께 어울리는
            <br />
            크루즈 일정을 추천해드립니다.
          </p>
        </div>

        {/* 우측 위저드 카드 — 오른쪽에서 날아옴 */}
        <div
          className={`w-[24em] shrink-0 rounded-[33px] bg-white px-[1.6em] py-[3.8em] text-[min(0.9625vw,18.48px)] shadow-2xl transition-all duration-700 ease-out max-[991px]:w-[85%] max-[991px]:text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.0582vw] max-[501px]:w-full ${
            finder.inView ? "translate-x-0 opacity-100" : "translate-x-20 opacity-0"
          }`}
        >
          {/* 진행바 */}
          <div className="mb-[1.8em] flex gap-[0.4em]">
            {questions.map((_, i) => (
              <span
                key={i}
                className={`h-[0.45em] flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-brand" : "bg-slate-200"
                }`}
              />
            ))}
          </div>

          {/* 질문 */}
          <div className="mb-[1.4em] text-center">
            <p className="text-[1.4857em] font-bold text-[#113667]">Q{step + 1}</p>
            <h3 className="mt-[0.3em] text-[1.4857em] font-bold leading-[1.4] text-navy">
              {cur.title[0]}
              <br />
              {cur.title[1]}
            </h3>
          </div>

          {/* 선택지 */}
          <div className="flex flex-col gap-[0.6em]">
            {cur.options.map((opt) => {
              const on = selected === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => choose(opt.value)}
                  className={`rounded-none py-[0.55em] text-[0.9714em] font-medium transition ${
                    on
                      ? "border-[2.48px] border-[#1E4D8B] bg-[#1E4D8B]/5 text-[#1E4D8B]"
                      : "border-[0.83px] border-[#D9D9D9] text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* 이전 / 다음 */}
          <div className="mt-[1.6em] grid grid-cols-2 gap-[0.6em]">
            <button
              onClick={prev}
              disabled={step === 0}
              className="rounded-none border-[1.02px] border-solid border-[#113667] py-[0.55em] text-[0.9714em] font-medium text-[#113667] transition enabled:hover:bg-slate-50 disabled:opacity-40"
            >
              이전
            </button>
            <button
              onClick={next}
              disabled={selected === null}
              className="rounded-none bg-[#113667] py-[0.55em] text-[0.9714em] font-medium text-white transition enabled:hover:brightness-125 disabled:opacity-40"
            >
              {step === total - 1 ? "일정 검색" : "다음"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
