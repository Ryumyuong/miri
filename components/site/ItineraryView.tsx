"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { ItineraryBlock, ItineraryDay } from "@/lib/types";
import { BLOCK_META, BLOCK_FIELDS, BLOCK_STYLE, isRichField, ITIN_TITLE_TEXT, ITIN_BODY_TEXT } from "@/lib/itinerary-blocks";
import { usePorts } from "@/lib/usePorts";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
// 텍스트 블록 글자 크기 옵션 → 기준 크기(18px/16px) 대비 배율. --itin-fs 로 전달한다.
const SIZE_MAP: Record<string, number> = { "작게": 0.85, "보통": 1, "크게": 1.3, "아주 크게": 1.6 };
// font-size는 클래스(ITIN_*_TEXT)로 주고, 인라인은 배율·색상만 넘긴다.
type TextStyle = CSSProperties & { "--itin-fs"?: number };

// 리치텍스트가 실질적으로 비어있는지 (빈 <p><br></p>·공백·&nbsp; 만 있으면 빈 것으로 간주)
function hasContent(v?: string): v is string {
  if (!v) return false;
  if (/<img|<video|<iframe/i.test(v)) return true;
  return v.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, "").replace(/\s/g, "").length > 0;
}

// 리치텍스트(HTML) 인라인 렌더
function Html({ v, className, style }: { v?: string; className?: string; style?: CSSProperties }) {
  if (!v) return null;
  return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: v }} />;
}
// 출발일 + N일차 → 실제 날짜 (예: 4월 15일 (화))
function dayDateLabel(departDate: string | undefined, dayNo: number): string {
  if (!departDate) return "";
  const d = new Date(departDate + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + dayNo);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

export default function ItineraryView({ days, departDate }: { days: ItineraryDay[]; departDate?: string }) {
  const [open, setOpen] = useState<Set<string>>(() => new Set(days.map((d) => d.id)));
  const allOpen = days.length > 0 && open.size === days.length;
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(days.map((d) => d.id)));
  const toggleDay = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  if (days.length === 0) return null;

  return (
    <div>
      <div className="mb-[1em] flex justify-end">
        <button
          onClick={toggleAll}
          className={`rounded-full border border-[#0B2A4A1a] px-[1.2em] py-[0.5em] ${ITIN_BODY_TEXT} font-semibold text-[#1E4D8B] transition hover:bg-[#1E4D8B]/5`}
        >
          {allOpen ? "전체 접기" : "전체 펼쳐보기"}
        </button>
      </div>

      <div className="flex flex-col gap-[1em]">
        {days.map((d) => {
          const isOpen = open.has(d.id);
          return (
            <div key={d.id} className="overflow-hidden rounded-[0.8em] border border-[#0B2A4A1a]">
              <button
                onClick={() => toggleDay(d.id)}
                className="flex w-full items-center justify-between bg-[#F5F7F9] px-[1.4em] py-[1.1em] text-left"
              >
                <span className="flex flex-wrap items-center gap-[0.8em]">
                  <span className={`rounded-full bg-navy px-[0.9em] py-[0.35em] ${ITIN_BODY_TEXT} font-bold text-white`}>
                    {d.dayNo + 1}일차
                  </span>
                  {dayDateLabel(departDate, d.dayNo) && (
                    <span className={`${ITIN_BODY_TEXT} font-semibold text-slate-500`}>{dayDateLabel(departDate, d.dayNo)}</span>
                  )}
                  {/* 일차 제목 = 제목 텍스트와 동일한 18px */}
                  {d.label && <span className={`${ITIN_TITLE_TEXT} font-bold text-navy`}>{d.label}</span>}
                </span>
                <span className={`${ITIN_BODY_TEXT} text-slate-400 transition ${isOpen ? "rotate-180" : ""}`}>▼</span>
              </button>

              {isOpen && (
                <div className="px-[1.4em] py-[1.4em]">
                  {d.blocks.length === 0 ? (
                    <p className={`${ITIN_BODY_TEXT} text-slate-400`}>등록된 내용이 없습니다.</p>
                  ) : (
                    <div className="relative flex flex-col pl-[1.3em]">
                      {/* 점 왼쪽 세로선 (1px #E5E7EB) */}
                      <span className="pointer-events-none absolute bottom-0 left-[5px] top-0 w-px bg-[#E5E7EB]" />
                      {[...d.blocks.filter((b) => b.type !== "meal"), ...d.blocks.filter((b) => b.type === "meal" && (b.breakfast || b.lunch || b.dinner || b.meal))].map((b) =>
                        b.type === "flight" ? (
                          <FlightRow key={b.id} block={b} />
                        ) : b.type === "air" ? (
                          <AirBlockRows key={b.id} block={b} />
                        ) : b.type === "airDepart" ? (
                          <AirEventRow key={b.id} block={b} dir="출발" />
                        ) : b.type === "airArrive" ? (
                          <AirEventRow key={b.id} block={b} dir="도착" />
                        ) : (
                          <BlockRow key={b.id} block={b} />
                        ),
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BlockRow({ block: b }: { block: ItineraryBlock }) {
  const [zoom, setZoom] = useState<string | null>(null); // 클릭한 이미지 확대
  const meta = BLOCK_META[b.type];
  const fields = BLOCK_FIELDS[b.type];
  const belowFields = fields.filter((f) => f.below);
  // 제목 없는 '제목 텍스트' 블록은 카드 없이 설명만
  const hasCard = fields.some((f) => !f.below) && !(b.type === "text" && !b.title);
  // 텍스트 블록(제목/내용) 글자 크기 배율·강조 색상
  const textStyle: TextStyle = {};
  if (b.fontSize && SIZE_MAP[b.fontSize]) textStyle["--itin-fs"] = SIZE_MAP[b.fontSize];
  if (b.color) textStyle.color = b.color;

  return (
    <div className="flex gap-[0.8em]">
      {/* 타임라인 */}
      <div className="relative flex w-[1.2em] shrink-0 justify-center">
        <span className="relative mt-[1.1em] grid h-[1.15em] w-[1.15em] place-items-center rounded-full bg-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_0px_#0000001a]">
          <span className={`h-[0.65em] w-[0.65em] rounded-full ${meta.dot}`} />
        </span>
      </div>

      <div className="min-w-0 flex-1 pt-[0.45em] pb-[0.7em]">
        {b.type === "tour" ? (
          <TourBlockView block={b} />
        ) : b.type === "meal" ? (
          <MealBlockView block={b} />
        ) : hasCard ? (
          <div className="grid grid-cols-2 gap-x-[1.5em] gap-y-[1em] py-[0.4em] max-[501px]:grid-cols-1">
              {fields
                .filter((f) => !f.below && !f.editorOnly)
                .map((f) => {
                  const v = b[f.key] as string | undefined;
                  if (f.isImage) {
                    const imgs = b.urls?.length ? b.urls : b.url ? [b.url] : [];
                    // 좌우 2열 고정 배열 (1장이거나 접은 모바일이면 1열).
                    // 칸 크기는 4:3으로 고정하되 object-contain 이라 원본이 잘리지 않는다 (남는 쪽에 여백).
                    // 사진 사이 간격은 px 고정 — em/vw 로 두면 보는 화면 폭마다 간격이 달라진다.
                    return imgs.length ? (
                      <div
                        key={String(f.key)}
                        className={`col-span-2 grid gap-[4px] max-[501px]:grid-cols-1 ${imgs.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                      >
                        {imgs.map((u, k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setZoom(u)}
                            aria-label={`이미지 ${k + 1} 확대`}
                            className="group block overflow-hidden rounded-[4px]"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={u}
                              alt=""
                              className="aspect-[4/3] w-full cursor-zoom-in bg-white object-contain transition duration-200 group-hover:scale-[1.03]"
                            />
                          </button>
                        ))}
                      </div>
                    ) : null;
                  }
                  return (
                    <Box
                      key={String(f.key)}
                      value={v}
                      full={f.full}
                      bold={f.bold}
                      icon={f.icon ?? (f.withIcon ? meta.icon : undefined)}
                      valueStyle={{ ...f.valueStyle, ...textStyle }}
                      valueClass={f.valueClass}
                      html={isRichField(f)}
                    />
                  );
                })}
          </div>
        ) : null}

        {/* 카드 아래 설명 (제목 텍스트의 설명) */}
        {belowFields.map((f) => {
          const v = b[f.key] as string | undefined;
          return hasContent(v) ? (
            <div key={String(f.key)} className="relative mt-[0.8em]">
              {/* 점 아래로 이어지는 세로 점선 (점에 맞춤) */}
              <span className="pointer-events-none absolute bottom-0 left-[-1.4em] top-0 w-[2px]" style={BLOCK_STYLE.descRule} />
              <p
                className={`whitespace-pre-line py-[1.1em] pl-[1.2em] pr-[1.2em] ${ITIN_BODY_TEXT} leading-[1.8] text-[#6A7282]`}
                style={textStyle}
                dangerouslySetInnerHTML={{ __html: v }}
              />
            </div>
          ) : null;
        })}
      </div>

      {zoom && <Lightbox src={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

// 이미지 확대 — body로 포털해서 미리보기 모달·스크롤 컨테이너 안에서도 화면 전체를 덮는다.
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex cursor-zoom-out items-center justify-center bg-black/85 p-4"
    >
      <button
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-4 top-4 text-[36px] leading-none text-white/80 transition hover:text-white"
      >
        ×
      </button>
      {/* 사진 자체를 눌러도 닫힌다 (배경·× 와 동일) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
    </div>,
    document.body,
  );
}

function Box({
  value,
  full,
  bold,
  icon,
  valueStyle,
  valueClass,
  html,
}: {
  value?: string;
  full?: boolean;
  bold?: boolean;
  icon?: string;
  valueStyle?: CSSProperties;
  valueClass?: string;
  html?: boolean;
}) {
  if (!value || (html && !hasContent(value))) return null;
  return (
    <div className={full ? "col-span-2" : ""}>
      <div
        className={`flex items-center gap-[0.5em] ${BLOCK_STYLE.valueBox} ${valueClass ?? BLOCK_STYLE.valueSize} ${bold ? "font-bold" : ""}`}
        style={{ ...BLOCK_STYLE.inter, ...valueStyle }}
      >
        {icon && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-[1.2em] w-[1.2em] shrink-0 object-contain" />
        )}
        {html ? (
          <span className="min-w-0 break-words" dangerouslySetInnerHTML={{ __html: value }} />
        ) : (
          <span className="min-w-0 break-words">{value}</span>
        )}
      </div>
    </div>
  );
}

// 날짜(ISO) → "5월 15일 (수)"
function fmtAirDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

// 항공 블록 — 출발/도착을 아예 별개의 타임라인 카드로 분리
function AirLegCard({ label, airline, place, date, time, desc }: { label: string; airline?: string; place?: string; date?: string; time?: string; desc?: string }) {
  const when = [fmtAirDate(date), time].filter(Boolean).join(" ");
  return (
    <div className="rounded-[10px] border border-[#2563EB1a] bg-[#2563EB08] px-[1.1em] py-[0.9em]">
      <p className={`flex items-center gap-[0.5em] ${ITIN_TITLE_TEXT} font-bold text-[#2563EB]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/itinerary-icons/f-plane.png" alt="" className="h-[1.1em] w-[1.1em] object-contain" />
        {label}
        {airline && <span className="font-medium text-[#6A7282]">· <Html v={airline} /></span>}
      </p>
      {place && <p className={`mt-[0.4em] ${ITIN_BODY_TEXT} font-semibold text-[#1E3A5F]`}><Html v={place} /></p>}
      {when && <p className={`mt-[0.15em] ${ITIN_BODY_TEXT} font-medium text-[#6A7282]`}>{when}</p>}
      {hasContent(desc) && <p className={`mt-[0.35em] whitespace-pre-line ${ITIN_BODY_TEXT} leading-[1.6] text-[#6A7282]`}><Html v={desc} /></p>}
    </div>
  );
}

// ── 경유 포함 단일 항공 카드 ──────────────────────────
function toMs(date?: string, time?: string): number | null {
  if (!date) return null;
  const d = new Date(`${date}T${time || "00:00"}:00`);
  return isNaN(d.getTime()) ? null : d.getTime();
}
function durLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}
function spanLabel(d1?: string, t1?: string, d2?: string, t2?: string): string {
  const a = toMs(d1, t1);
  const b = toMs(d2, t2);
  if (a == null || b == null || b <= a) return "";
  return durLabel(Math.round((b - a) / 60000));
}
// 구간 비행시간(분): 관리자가 입력한 소요시간(시차 반영) 우선, 없으면 벽시계 자동계산.
// 도착일이 비어 있으면 출발일로 가정(도착시간이 더 이르면 다음날). 48시간 초과는 데이터 오류로 보고 미표시.
function segFlightMin(s: { dateDepart?: string; timeDepart?: string; dateArrive?: string; timeArrive?: string; durationMin?: number }): number | null {
  if (typeof s.durationMin === "number" && s.durationMin > 0) return s.durationMin;
  if (!s.timeDepart || !s.timeArrive) return null;
  const a = toMs(s.dateDepart, s.timeDepart);
  let b = toMs(s.dateArrive || s.dateDepart, s.timeArrive); // 도착일 없으면 출발일 기준
  if (a == null || b == null) return null;
  if (b <= a) b += 24 * 60 * 60 * 1000; // 도착이 출발보다 이르면 다음날로
  const min = Math.round((b - a) / 60000);
  return min > 0 && min <= 48 * 60 ? min : null; // 48시간 초과 = 날짜 오입력으로 판단
}
// 전체 총 소요시간(분): 각 구간 비행시간 + 구간 사이 대기시간(같은 공항=시차 없음, 벽시계로 정확)
function totalFlightMin(segs: { dateDepart?: string; timeDepart?: string; dateArrive?: string; timeArrive?: string; durationMin?: number }[]): number | null {
  let sum = 0;
  for (let i = 0; i < segs.length; i++) {
    const f = segFlightMin(segs[i]);
    if (f == null) return null; // 하나라도 계산 불가면 전체 미표시
    sum += f;
    if (i < segs.length - 1) {
      const a = toMs(segs[i].dateArrive, segs[i].timeArrive);
      const b = toMs(segs[i + 1].dateDepart, segs[i + 1].timeDepart);
      // 경유 대기 = 같은 공항이라 시차 없음(벽시계 정확). 48시간 초과는 날짜 오입력으로 보고 제외.
      if (a != null && b != null && b > a) {
        const layover = Math.round((b - a) / 60000);
        if (layover <= 48 * 60) sum += layover;
      }
    }
  }
  return sum > 0 ? sum : null;
}

function FlightRow({ block: b }: { block: ItineraryBlock }) {
  const [open, setOpen] = useState(false);
  const segs = (b.segments ?? []).filter((s) => s.from || s.to || s.timeDepart || s.timeArrive || s.airline);
  if (segs.length === 0) return null;
  const first = segs[0];
  const last = segs[segs.length - 1];
  const stops = segs.length - 1;
  const totalMin = totalFlightMin(segs);
  const total = totalMin != null ? durLabel(totalMin) : "";

  return (
    <div className="flex gap-[0.8em]">
      <div className="relative flex w-[1.2em] shrink-0 justify-center">
        <span className="relative mt-[1.1em] grid h-[1.15em] w-[1.15em] place-items-center rounded-full bg-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_0px_#0000001a]">
          <span className="h-[0.65em] w-[0.65em] rounded-full bg-[#2563EB]" />
        </span>
      </div>
      <div className="min-w-0 flex-1 pt-[0.45em] pb-[0.7em]">
        <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
          {/* 헤더 — 항공 카드는 기존 크기 유지 (18/16 통일 대상에서 제외) */}
          <div className="flex flex-wrap items-center justify-center gap-x-[0.6em] gap-y-[0.2em] border-b border-slate-100 px-[1em] py-[0.7em] text-[min(1.0366vw,19.9027px)] max-[991px]:text-[min(2.6924vw,16.1544px)] max-[501px]:text-[2.6143vw]">
            <span className="font-bold text-[#2563EB]"><Html v={first.airline} /></span>
            <span className="text-slate-300">✈</span>
            {stops > 0 && <span className="text-slate-500">경유 {stops}회</span>}
          </div>
          {/* 요약 (클릭 시 펼침) */}
          <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-[0.8em] px-[1.2em] py-[1em] text-left">
            <div className="min-w-0 text-center">
              {fmtAirDate(first.dateDepart) && <p className="text-[min(0.8782vw,16.8624px)] max-[991px]:text-[min(2.2804vw,13.6824px)] max-[501px]:text-[2.2146vw] text-slate-400">{fmtAirDate(first.dateDepart)}</p>}
              <p className="text-[min(1.3068vw,25.0906px)] max-[991px]:text-[min(3.3935vw,20.361px)] max-[501px]:text-[3.2952vw] font-bold leading-tight text-navy">{first.timeDepart || "--:--"}</p>
              <p className="truncate text-[min(0.9757vw,18.7334px)] max-[991px]:text-[min(2.5337vw,15.2022px)] max-[501px]:text-[2.4606vw] text-slate-500">{first.from}</p>
            </div>
            <div className="flex flex-1 flex-col items-center text-[min(0.8539vw,16.3949px)] max-[991px]:text-[min(2.2171vw,13.3026px)] max-[501px]:text-[2.153vw] text-slate-400">
              {stops > 0 && <span>경유 {stops}회</span>}
              <span className="my-[0.3em] flex w-full items-center gap-1">
                <span className="h-px flex-1 bg-slate-200" />✈<span className="h-px flex-1 bg-slate-200" />
              </span>
              {total && <span>{total}</span>}
            </div>
            <div className="min-w-0 text-center">
              {fmtAirDate(last.dateArrive) && <p className="text-[min(0.8782vw,16.8624px)] max-[991px]:text-[min(2.2804vw,13.6824px)] max-[501px]:text-[2.2146vw] text-slate-400">{fmtAirDate(last.dateArrive)}</p>}
              <p className="text-[min(1.3068vw,25.0906px)] max-[991px]:text-[min(3.3935vw,20.361px)] max-[501px]:text-[3.2952vw] font-bold leading-tight text-navy">{last.timeArrive || "--:--"}</p>
              <p className="truncate text-[min(0.9757vw,18.7334px)] max-[991px]:text-[min(2.5337vw,15.2022px)] max-[501px]:text-[2.4606vw] text-slate-500">{last.to}</p>
            </div>
            <span className={`shrink-0 text-slate-300 transition ${open ? "rotate-180" : ""}`}>▾</span>
          </button>
          {/* 구간 상세 */}
          {open && (
            <div className="border-t border-slate-100 px-[1.2em] py-[1em]">
              {segs.map((s, i) => (
                <div key={i}>
                  {s.airline && <p className="mb-[0.4em] text-[min(1.1088vw,21.289px)] max-[991px]:text-[min(2.8792vw,17.2752px)] max-[501px]:text-[2.7961vw] font-bold text-[#2563EB]"><Html v={s.airline} /></p>}
                  <div className="flex gap-[0.7em] text-[min(1.178vw,22.6195px)] max-[991px]:text-[min(3.0595vw,18.357px)] max-[501px]:text-[2.9708vw]">
                    <div className="flex flex-col items-center pt-[0.35em]">
                      <span className="h-[0.5em] w-[0.5em] rounded-full border-2 border-slate-400" />
                      <span className="my-[0.2em] w-px flex-1 bg-slate-200" />
                      <span className="h-[0.5em] w-[0.5em] rounded-full border-2 border-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p><span className="font-semibold text-navy">{s.timeDepart}</span> <span className="text-slate-500">{s.from}</span></p>
                      {segFlightMin(s) != null && (
                        <p className="my-[0.3em] text-[0.85em] text-slate-400">{durLabel(segFlightMin(s)!)}</p>
                      )}
                      <p><span className="font-semibold text-navy">{s.timeArrive}</span> <span className="text-slate-500">{s.to}</span></p>
                    </div>
                  </div>
                  {i < segs.length - 1 && spanLabel(s.dateArrive, s.timeArrive, segs[i + 1].dateDepart, segs[i + 1].timeDepart) && (
                    <div className="my-[0.6em] rounded bg-slate-50 px-[0.9em] py-[0.5em] text-[min(1.1088vw,21.289px)] max-[991px]:text-[min(2.8792vw,17.2752px)] max-[501px]:text-[2.7961vw] text-slate-500">
                      {spanLabel(s.dateArrive, s.timeArrive, segs[i + 1].dateDepart, segs[i + 1].timeDepart)} 공항 내 연결
                    </div>
                  )}
                </div>
              ))}
              <p className="mt-[0.8em] text-[min(1.0812vw,20.7568px)] max-[991px]:text-[min(2.8075vw,16.845px)] max-[501px]:text-[2.7261vw] text-slate-400">
                도착: {fmtAirDate(last.dateArrive) || "-"}
                {total && <> · 여행기간: {total}</>}
              </p>
            </div>
          )}
        </div>
        {hasContent(b.blockDesc) && <p className={`mt-[0.5em] whitespace-pre-line ${ITIN_BODY_TEXT} leading-[1.6] text-[#6A7282]`}><Html v={b.blockDesc} /></p>}
      </div>
    </div>
  );
}

// 출발/도착 항공 — 단일 이벤트 카드(타임라인 한 행)
function AirEventRow({ block: b, dir }: { block: ItineraryBlock; dir: "출발" | "도착" }) {
  const date = dir === "출발" ? b.dateDepart : b.dateArrive;
  const time = dir === "출발" ? b.time : b.timeArrive;
  const place = dir === "출발" ? b.from : b.to;
  const when = [fmtAirDate(date), time].filter(Boolean).join(" ");
  return (
    <div className="flex gap-[0.8em]">
      <div className="relative flex w-[1.2em] shrink-0 justify-center">
        <span className="relative mt-[1.1em] grid h-[1.15em] w-[1.15em] place-items-center rounded-full bg-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_0px_#0000001a]">
          <span className="h-[0.65em] w-[0.65em] rounded-full bg-[#2563EB]" />
        </span>
      </div>
      <div className="min-w-0 flex-1 pt-[0.45em] pb-[0.7em]">
        <div className="rounded-[10px] border border-[#2563EB1a] bg-[#2563EB08] px-[1.1em] py-[0.9em]">
          <p className={`flex items-center gap-[0.5em] ${ITIN_TITLE_TEXT} font-bold text-[#2563EB]`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/itinerary-icons/f-plane.png" alt="" className="h-[1.1em] w-[1.1em] object-contain" />
            {dir}
            {b.airline && <span className="font-medium text-[#6A7282]">· <Html v={b.airline} /></span>}
          </p>
          {place && <p className={`mt-[0.4em] ${ITIN_BODY_TEXT} font-semibold text-[#1E3A5F]`}><Html v={place} /></p>}
          {when && <p className={`mt-[0.15em] ${ITIN_BODY_TEXT} font-medium text-[#6A7282]`}>{when}</p>}
          {hasContent(b.blockDesc) && <p className={`mt-[0.35em] whitespace-pre-line ${ITIN_BODY_TEXT} leading-[1.6] text-[#6A7282]`}><Html v={b.blockDesc} /></p>}
        </div>
      </div>
    </div>
  );
}

function AirBlockRows({ block: b }: { block: ItineraryBlock }) {
  const legs = [
    { label: "출발", place: b.from, date: b.dateDepart, time: b.time },
    { label: "도착", place: b.to, date: b.dateArrive, time: b.timeArrive },
  ].filter((l) => l.place || l.date || l.time);
  if (legs.length === 0) return null;
  return (
    <>
      {legs.map((leg, i) => (
        <div key={i} className="flex gap-[0.8em]">
          {/* 타임라인 점 */}
          <div className="relative flex w-[1.2em] shrink-0 justify-center">
            <span className="relative mt-[1.1em] grid h-[1.15em] w-[1.15em] place-items-center rounded-full bg-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_0px_#0000001a]">
              <span className="h-[0.65em] w-[0.65em] rounded-full bg-[#2563EB]" />
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-[0.45em] pb-[0.7em]">
            <AirLegCard
              label={leg.label}
              airline={b.airline}
              place={leg.place}
              date={leg.date}
              time={leg.time}
              desc={i === legs.length - 1 ? b.blockDesc : undefined}
            />
          </div>
        </div>
      ))}
    </>
  );
}

// 식사 블록 — 조식/중식/석식 배지 + 내용 (미포함도 표시). 하루 1개.
function MealBlockView({ block: b }: { block: ItineraryBlock }) {
  // 입력된 식사 내용이 하나도 없으면 표시하지 않음 (자동 추가된 빈 식사 블록)
  if (!b.breakfast && !b.lunch && !b.dinner && !b.meal) return null;
  // 구버전 호환: breakfast/lunch/dinner 미사용 + meal+place 단일이면 그 한 끼만 표시
  const isLegacy =
    b.breakfast == null && b.lunch == null && b.dinner == null && !!b.meal;
  const items: [string, string | undefined][] = isLegacy
    ? [[b.meal as string, b.place]]
    : [["조식", b.breakfast], ["중식", b.lunch], ["석식", b.dinner]];
  return (
    <div className={`flex flex-wrap items-center gap-x-[1.1em] gap-y-[0.4em] py-[0.4em] ${ITIN_BODY_TEXT}`}>
      <span className={`${ITIN_TITLE_TEXT} font-bold text-navy`}>식사</span>
      {items.map(([label, val]) => (
        <span key={label} className="flex items-center gap-[0.4em]">
          <span className="rounded bg-navy/5 px-[0.6em] py-[0.2em] font-bold text-navy">{label}</span>
          <span className={val ? "text-slate-600" : "text-slate-300"}>{val || "미포함"}</span>
        </span>
      ))}
    </div>
  );
}

// 관광정보 블록 — 기항지: 안내 카드 / 관광지: 카드 없이 텍스트
function TourBlockView({ block: b }: { block: ItineraryBlock }) {
  // 관광정보 카드를 실시간 참조 (카드 수정 시 반영). 없으면 저장된 복사본으로 대체.
  const { ports } = usePorts();
  const card = ports.find((p) => p.id === b.tourCardId);
  const kind = card?.kind ?? b.tourKind ?? "기항지";
  const name = card?.name ?? b.tourName;
  const country = card?.country ?? b.tourCountry;
  const desc = card?.description ?? b.tourDesc;
  const image = card?.imageUrl ?? b.tourImage;

  // 관광지 — 카드 없이 텍스트로만 표시
  if (kind === "관광지") {
    return (
      <div className="py-[0.2em]">
        <p className={`${ITIN_TITLE_TEXT} font-bold text-navy`}>
          <Html v={name} />
          {country && <Html v={country} className={`ml-[0.5em] ${ITIN_BODY_TEXT} font-normal text-slate-400`} />}
        </p>
        {hasContent(desc) && (
          <p className={`mt-[0.2em] whitespace-pre-line ${ITIN_BODY_TEXT} leading-[1.7] text-slate-500`}><Html v={desc} /></p>
        )}
      </div>
    );
  }

  // 기항지 — 안내 카드
  return (
    <div className="rounded-[0.5em] border border-slate-200 bg-white p-[1em]">
      <div className="flex gap-[1em] max-[501px]:flex-col">
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-[6.5em] w-[10em] shrink-0 rounded-[0.4em] object-cover max-[501px]:w-full" />
        )}
        <div className="min-w-0 flex-1">
          <p className={`flex flex-wrap items-center gap-[0.5em] ${ITIN_TITLE_TEXT} font-bold text-navy`}>
            <Html v={name} />
            <span className="rounded bg-[#1E4D8B] px-[0.5em] py-[0.15em] text-[0.7em] font-semibold text-white">기항지 안내</span>
          </p>
          <p className={`mt-[0.4em] ${ITIN_BODY_TEXT} font-bold text-[#1E4D8B]`}><Html v={country} /></p>
          <p className={`mt-[0.3em] whitespace-pre-line ${ITIN_BODY_TEXT} leading-[1.6] text-slate-500`}><Html v={desc} /></p>
        </div>
      </div>
    </div>
  );
}
