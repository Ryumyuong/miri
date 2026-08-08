"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useSettings } from "@/lib/settings";
import type { Voyage } from "@/lib/types";
import ItineraryView from "@/components/site/ItineraryView";
import SpecialTerms from "@/components/site/SpecialTerms";

function won(n: number) {
  return "₩" + n.toLocaleString("ko-KR");
}

type Opt = { date: string; arrive: string; price: number; flight: string };

/** 상품 인쇄 미리보기 — 인쇄하기(window.print) / 메일보내기(mailto). 인쇄 시 #print-area 만 출력. */
export default function PrintSheet({
  voyage: v,
  opt,
  included,
  excluded,
  features,
  meetingPlace,
  productDesc,
  onClose,
}: {
  voyage: Voyage;
  opt: Opt;
  included: string[];
  excluded: string[];
  features: string[];
  meetingPlace: string;
  productDesc?: string;
  onClose: () => void;
}) {
  const { settings } = useSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const productName = `${v.line} ${v.region}크루즈 ${v.days}일`;

  const doPrint = () => window.print();

  if (!mounted) return null;

  return createPortal(
    <div
      className="print-portal fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-lg bg-white shadow-xl"
      >
        {/* 상단 바 — 고정 (인쇄 시 숨김) */}
        <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-8 py-4">
          <h2 className="text-[17px] font-bold text-[#0B2A4A]">인쇄하기</h2>
          <div className="flex items-center gap-2">
            <button onClick={doPrint} className="rounded-md bg-[#1E4D8B] px-4 py-2 text-[14px] font-semibold text-white transition hover:brightness-110">
              인쇄하기
            </button>
            <button onClick={onClose} aria-label="닫기" className="ml-1 px-2 py-1 text-[18px] text-slate-400 hover:text-slate-700">
              ✕
            </button>
          </div>
        </div>

        {/* 스크롤 영역 (인쇄 대상) */}
        <div id="print-area" className="flex-1 overflow-y-auto p-8" style={{ fontSize: "14px", color: "#1f2937" }}>
          {/* 제목 */}
          <h1 className="mb-5 text-[24px] font-black text-[#0B2A4A]">{v.title}</h1>

        {/* 썸네일 + 정보표 */}
        <div className="grid grid-cols-2 gap-6 max-[600px]:grid-cols-1">
          <div>
            {v.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.thumbnail} alt={v.title} className="w-full rounded-md object-cover" />
            )}
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-color.png" alt="" className="h-9 w-auto shrink-0 object-contain" />
              <div className="text-[13px] leading-relaxed text-slate-600">
                <p>담당자 : {settings.companyName}</p>
                <p>연락처 : {settings.phone}</p>
                <p>이메일 : {settings.email}</p>
              </div>
            </div>
          </div>

          <table className="h-fit w-full border-collapse text-[13px]">
            <tbody>
              <InfoRow label="상품행사명" value={productName} />
              <InfoRow label="여행기간" value={`${v.nights}박 ${v.days}일`} />
              <InfoRow label="출발지" value={meetingPlace} />
              <InfoRow label="출발일정" value={opt.date} />
              <InfoRow label="도착일정" value={opt.arrive} />
              <InfoRow
                label="요금"
                value={
                  opt.price > 0 ? (
                    <div className="leading-relaxed">
                      <span className="text-[#C81E1E]">성인 <b>{won(opt.price)}</b></span>
                      <br />소인 <b>{won(opt.price)}</b>
                      <br />유아 <b>0원</b>
                      <br />영아 <b>0원</b>
                    </div>
                  ) : (
                    "요금문의"
                  )
                }
              />
              <InfoRow label="옵션" value="-" />
            </tbody>
          </table>
        </div>

        {/* 이용특전 및 참조사항 */}
        <Section title="이용특전 및 참조사항">
          {productDesc && <p className="mb-2 whitespace-pre-line leading-relaxed">{productDesc}</p>}
          {features.length > 0 && (
            <ul className="list-disc pl-5 leading-relaxed">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
        </Section>

        {/* 포함 / 불포함 */}
        <Section title="포함사항">
          <ul className="list-disc pl-5 leading-relaxed text-[#1E4D8B]">
            {included.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Section>
        <Section title="불포함사항">
          <ul className="list-disc pl-5 leading-relaxed text-[#1E4D8B]">
            {excluded.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </Section>

        {/* 유의사항 (취소규정 자동 계산) — 글자 크기 통일 */}
        <Section title="유의사항">
          <div className="print-compact">
            <SpecialTerms departDate={opt.date} />
          </div>
        </Section>

        {/* 일정표 — 글자 크기 통일 */}
        {v.itineraryDays && v.itineraryDays.length > 0 && (
          <Section title="일정표">
            <div className="print-compact">
              <ItineraryView days={v.itineraryDays} departDate={opt.date} />
            </div>
          </Section>
        )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <tr className="border-b border-dashed border-slate-200 align-top">
      <th className="w-28 py-2.5 pr-3 text-left font-bold text-[#0B2A4A]">{label}</th>
      <td className="py-2.5 text-slate-700">{value}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="mb-2 border-l-4 border-[#1E4D8B] pl-2 text-[15px] font-bold text-[#0B2A4A]">{title}</h3>
      <div className="rounded-md border border-slate-200 p-4">{children}</div>
    </section>
  );
}
