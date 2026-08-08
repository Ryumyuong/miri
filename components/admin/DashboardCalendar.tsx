"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useVoyages } from "@/lib/useVoyages";
import { useReservations } from "@/lib/useReservations";
import DashboardAlerts from "@/components/admin/DashboardAlerts";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 상태별 점 색상
const STATUS_DOT: Record<string, string> = {
  "출발 확정": "bg-emerald-500",
  "예약 가능": "bg-blue-500",
  "예약 중": "bg-blue-500",
  마감: "bg-slate-400",
  취소: "bg-red-500",
};

type Ev = { type: "출발" | "귀국"; day: number; title: string; status: string; id: string; departDate: string; arriveDate?: string };

// 상품(일정)별 색상 — 한 달에 3~4색이 순환하며, 같은 상품의 출발/귀국은 같은 색
const PALETTE = ["bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-teal-500"];
// YYYY-MM-DD → M/D
const md = (iso?: string) => (iso ? `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}` : "");

export default function DashboardCalendar() {
  const { voyages } = useVoyages();
  const { reservations } = useReservations();
  // 날짜는 클라이언트에서만 계산 (SSR/hydration 불일치로 인한 깜빡임 방지)
  const [today, setToday] = useState<Date | null>(null);
  const [ym, setYm] = useState<{ y: number; m: number } | null>(null); // m: 0-11
  const [selectedDay, setSelectedDay] = useState<number | null>(null); // 선택한 날짜(일), null=전체
  const [popupDay, setPopupDay] = useState<number | null>(null); // 팝업으로 띄운 날짜
  const [newBookingOpen, setNewBookingOpen] = useState(false); // 이번 달 신규예약 명단 팝업
  useEffect(() => {
    const d = new Date();
    setToday(d);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
  }, []);
  if (!ym || !today) return <div className="min-h-[52em]" />;
  const now = today;

  const monthKey = `${ym.y}-${String(ym.m + 1).padStart(2, "0")}`;
  const startDow = new Date(ym.y, ym.m, 1).getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const isToday = (d: number) => now.getFullYear() === ym.y && now.getMonth() === ym.m && now.getDate() === d;

  // 이번 달 이벤트 수집
  const events: Ev[] = [];
  for (const v of voyages) {
    if (v.departDate?.startsWith(monthKey)) {
      events.push({ type: "출발", day: Number(v.departDate.slice(8, 10)), title: v.title, status: v.status, id: v.id, departDate: v.departDate, arriveDate: v.arriveDate });
    }
    if (v.arriveDate?.startsWith(monthKey)) {
      events.push({ type: "귀국", day: Number(v.arriveDate.slice(8, 10)), title: v.title, status: v.status, id: v.id, departDate: v.departDate, arriveDate: v.arriveDate });
    }
  }
  const byDay = new Map<number, Ev[]>();
  for (const e of events) {
    const arr = byDay.get(e.day) ?? [];
    arr.push(e);
    byDay.set(e.day, arr);
  }
  const sorted = [...events].sort((a, b) => a.day - b.day);

  // 이번 달 등장 순서로 상품별 색상 배정 (같은 상품 = 같은 색, 3~4색 순환)
  const monthVoyageIds: string[] = [];
  for (const e of sorted) if (!monthVoyageIds.includes(e.id)) monthVoyageIds.push(e.id);
  const colorOf = (id: string) => PALETTE[Math.max(0, monthVoyageIds.indexOf(id)) % PALETTE.length];
  // 출발~귀국 기간 라벨 (예: 2/8 출발 ~ 2/13 귀국)
  const rangeLabel = (e: Ev) => `${md(e.departDate)} 출발${e.arriveDate ? ` ~ ${md(e.arriveDate)} 귀국` : ""}`;

  // 요약 지표
  const departCount = events.filter((e) => e.type === "출발").length;
  const confirmedCount = voyages.filter((v) => v.departDate?.startsWith(monthKey) && v.status === "출발 확정").length;
  // 이번 달 출발 예약들의 총 인원
  const peopleCount = reservations
    .filter((r) => r.departDate?.startsWith(monthKey))
    .reduce((s, r) => s + (r.headcount ?? 0), 0);
  // 이번 달 신규 예약 (신청 생성일 기준) — 건수 + 인원
  const newResv = reservations.filter((r) => r.createdAt?.slice(0, 7) === monthKey);
  const newBookingCount = newResv.length;
  const newPeople = newResv.reduce((s, r) => s + (r.headcount ?? r.passengers?.length ?? 1), 0);

  // 월 넘김 정규화
  const norm = (y: number, m: number) => {
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    return { y, m };
  };
  const prev = () => { setYm(norm(ym.y, ym.m - 1)); setSelectedDay(null); };
  const next = () => { setYm(norm(ym.y, ym.m + 1)); setSelectedDay(null); };

  // 선택 날짜가 있으면 그 날 이벤트만, 없으면 전체
  const panelEvents = selectedDay ? sorted.filter((e) => e.day === selectedDay) : sorted;

  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* 요약 지표 */}
      <div className="grid grid-cols-4 gap-4 max-[991px]:grid-cols-2">
        <Stat icon="/icons/summary/stat-depart.png" label="이번 달 출발" value={`${departCount}건`} />
        <Stat icon="/icons/summary/stat-confirm.png" label="출발 확정" value={`${confirmedCount}건`} />
        <Stat icon="/icons/summary/stat-people.png" label="총 탑승 예정" value={`${peopleCount}명`} />
        <Stat
          icon="/icons/summary/stat-people.png"
          label={`이번 달 신규예약 (${newBookingCount}건)`}
          value={`${newPeople}명`}
          onClick={newBookingCount > 0 ? () => setNewBookingOpen(true) : undefined}
        />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)] gap-4 max-[991px]:grid-cols-1">
        {/* 달력 */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between px-2">
            <button onClick={prev} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">‹</button>
            <p className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-800">{ym.y}년 {ym.m + 1}월</p>
            <button onClick={next} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">›</button>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 pb-2 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-medium">
            {WEEKDAYS.map((w, i) => (
              <span key={w} className={i === 0 ? "text-red-400" : "text-slate-400"}>{w}</span>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const evs = d ? byDay.get(d) ?? [] : [];
              const sun = i % 7 === 0;
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (!d) return;
                    setSelectedDay(d);
                    if ((byDay.get(d) ?? []).length) setPopupDay(d);
                  }}
                  className={`min-h-[7em] border-b border-r border-slate-50 p-2 [&:nth-child(7n)]:border-r-0 ${
                    d ? "cursor-pointer transition hover:bg-slate-50" : ""
                  } ${d && selectedDay === d ? "bg-[#1E4D8B]/5 ring-1 ring-inset ring-[#1E4D8B]/40" : ""}`}
                >
                  {d && (
                    <>
                      <span
                        className={`inline-grid h-6 min-w-[1.5rem] place-items-center rounded-full px-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] ${
                          isToday(d) ? "bg-[#1E4D8B] font-bold text-white" : sun ? "text-red-400" : "text-slate-600"
                        }`}
                      >
                        {d}
                      </span>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {evs.slice(0, 2).map((e, k) => (
                          <span
                            key={k}
                            title={`${e.type} · ${e.title}`}
                            className={`truncate rounded px-1 text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] font-medium text-white ${colorOf(e.id)}`}
                          >
                            {e.type === "출발" ? "▶" : "◀"} {e.title.replace(/\[.*?\]/g, "").trim().slice(0, 6)}
                          </span>
                        ))}
                        {evs.length > 2 && <span className="px-1 text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] text-slate-400">+{evs.length - 2}</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 알림 + 범례 + 전체 일정 */}
        <div className="flex flex-col gap-4">
          {/* 오늘 기준 알림 — 대시보드에서 바로 확인 */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-400">알림</p>
            <DashboardAlerts limit={6} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-400">범례</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-600">
              <span>▶ 출발</span>
              <span>◀ 귀국</span>
              <span className="text-[0.9286em] text-slate-400">· 같은 색 = 같은 상품(출발↔귀국)</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PALETTE.map((c) => (
                <span key={c} className={`h-3 w-7 rounded ${c}`} />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-600">
              <Legend dot="bg-emerald-500" label="출발 확정" />
              <Legend dot="bg-blue-500" label="예약중" />
              <Legend dot="bg-slate-400" label="마감" />
              <Legend dot="bg-red-500" label="취소" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-400">
                {selectedDay ? `${ym.m + 1}월 ${selectedDay}일 일정` : `${ym.m + 1}월 전체 일정`}
              </p>
              {selectedDay && (
                <button onClick={() => setSelectedDay(null)} className="text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-semibold text-[#1E4D8B] hover:underline">
                  전체 보기
                </button>
              )}
            </div>
            {panelEvents.length === 0 ? (
              <p className="py-12 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-300">일정 없음</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {panelEvents.map((e, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-lg border border-slate-100 px-3 py-2">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[e.status] ?? "bg-slate-300"}`} />
                    <span className="mt-0.5 shrink-0 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-400">{ym.m + 1}.{e.day}</span>
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] font-bold text-white ${colorOf(e.id)}`}>{e.type}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-keep text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-700">{e.title}</span>
                      <span className="mt-0.5 block text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] text-slate-400">{rangeLabel(e)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* 이번 달 신규예약 명단 팝업 */}
      {newBookingOpen && (
        <div onClick={() => setNewBookingOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-800">{ym.m + 1}월 신규예약 <span className="text-[0.8em] font-normal text-slate-400">{newBookingCount}건 · {newPeople}명</span></h3>
              <button onClick={() => setNewBookingOpen(false)} aria-label="닫기" className="text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-6 py-4">
              <ul className="flex flex-col gap-2">
                {[...newResv].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? "")).map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/voyages/${r.voyageId}`}
                    onClick={() => setNewBookingOpen(false)}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-bold text-slate-800">{r.name || "이름없음"}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] font-semibold text-slate-500">일행 {r.passengers?.length ?? r.headcount ?? 1}명</span>
                      </span>
                      <span className="mt-0.5 block break-keep text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-500">{r.voyageTitle}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] text-slate-400">{r.createdAt?.slice(0, 10) ?? "-"}</span>
                      {r.code && <span className="block font-mono text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] text-slate-400">{r.code}</span>}
                    </span>
                  </Link>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 날짜 클릭 팝업 — 해당 일 일정 */}
      {popupDay && (
        <div onClick={() => setPopupDay(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-800">{ym.y}년 {ym.m + 1}월 {popupDay}일 일정</h3>
              <button onClick={() => setPopupDay(null)} aria-label="닫기" className="text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 hover:text-slate-600">✕</button>
            </div>
            {(byDay.get(popupDay) ?? []).length === 0 ? (
              <p className="py-8 text-center text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-300">일정 없음</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(byDay.get(popupDay) ?? []).map((e, i) => (
                  <Link
                    key={i}
                    href={`/admin/voyages/${e.id}`}
                    onClick={() => setPopupDay(null)}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-100 px-3 py-2.5 transition hover:bg-slate-50"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[e.status] ?? "bg-slate-300"}`} />
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] font-bold text-white ${colorOf(e.id)}`}>{e.type}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block break-keep text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-700">{e.title}</span>
                      <span className="mt-0.5 block text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] text-slate-400">{rangeLabel(e)}</span>
                    </span>
                    <span className="mt-0.5 shrink-0 text-slate-300">›</span>
                  </Link>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, onClick }: { icon: string; label: string; value: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 ${
        onClick ? "cursor-pointer transition hover:border-[#1E4D8B] hover:bg-[#1E4D8B]/5" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-50">
        <img src={icon} alt="" className="h-6 w-6 object-contain" />
      </span>
      <div>
        <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{label}{onClick && <span className="ml-1 text-[#1E4D8B]">›</span>}</p>
        <p className="text-[min(1.375vw,26.4px)] font-bold text-slate-800 max-[991px]:text-[min(3.2377vw,19.4262px)] max-[501px]:text-[3.932vw]">{value}</p>
      </div>
    </div>
  );
}

function Legend({ bar, dot, label }: { bar?: string; dot?: string; label: string }) {
  return (
    <span className="flex items-center gap-2.5">
      {bar && <span className={`h-3.5 w-1.5 rounded-full ${bar}`} />}
      {dot && <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />}
      {label}
    </span>
  );
}
