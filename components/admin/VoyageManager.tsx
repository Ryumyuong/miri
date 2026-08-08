"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import type { Voyage, VoyageStatus } from "@/lib/types";
import { REGION_OPTS, matchesRegion } from "@/lib/region-filter";
import { DEFAULT_INCLUDED, DEFAULT_EXCLUDED } from "@/lib/voyage-defaults";
import { useVoyages } from "@/lib/useVoyages";
import {
  addVoyage,
  updateVoyage,
  deleteVoyage,
  seedVoyages,
  backfillVoyageCodes,
  computeDDay,
  computeStatus,
  type VoyageInput,
} from "@/lib/voyages";
import { useReservations } from "@/lib/useReservations";
import { useShips } from "@/lib/useShips";
import { aggregateForVoyage } from "@/lib/reservations";
import ImageUploader from "@/components/ImageUploader";
import Pagination from "@/components/admin/Pagination";

const statusBadge: Record<string, string> = {
  "출발 확정": "bg-emerald-100 text-emerald-700",
  "예약 가능": "bg-sky-100 text-sky-700",
  "예약 중": "bg-blue-100 text-blue-700",
  마감: "bg-slate-200 text-slate-500",
};

const STATUSES: VoyageStatus[] = ["예약 가능", "예약 중", "출발 확정", "마감"];

const empty: VoyageInput = {
  title: "",
  region: "",
  shipName: "",
  line: "",
  departDate: "",
  arriveDate: "",
  nights: 0,
  days: 0,
  priceFrom: 0,
  countries: [],
  itinerary: [],
};

export default function VoyageManager() {
  const { voyages, loading } = useVoyages();
  const { reservations } = useReservations();
  // 출발일자(출항일) 오름차순 자동 정렬
  const sortedVoyages = [...voyages].sort((a, b) => a.departDate.localeCompare(b.departDate));
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [region, setRegion] = useState<string | null>(null); // 권역 필터 (null=전체, /cruises와 동일 세부 권역)
  const filtered = sortedVoyages.filter((v) => matchesRegion(v, region));

  // 승객 이름 검색 — 모든 예약의 승객 명단에서 이름으로 찾아 해당 운항일정을 바로 표시
  const [search, setSearch] = useState("");
  const q = search.trim();
  const vmap = new Map(voyages.map((v) => [v.id, v] as const));
  const searchResults = q
    ? reservations.flatMap((r) => {
        const v = vmap.get(r.voyageId);
        const ps = r.passengers?.length ? r.passengers : [{ nameKo: r.name, phone: r.phone, roomType: r.room }];
        return ps
          .filter((p) => (p.nameKo || "").replace(/\s/g, "").includes(q.replace(/\s/g, "")))
          .map((p) => ({
            key: `${r.id}-${p.nameKo ?? ""}`,
            name: p.nameKo || r.name,
            phone: p.phone || r.phone,
            room: p.roomType || r.room,
            voyageId: r.voyageId,
            voyageTitle: v?.title || r.voyageTitle,
            departDate: v?.departDate || r.departDate,
          }));
      })
    : [];
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // null=닫힘. mode "edit"=기존 수정, "new"=신규/복제(저장 시 새 일정 생성)
  const [dialog, setDialog] = useState<{ mode: "new" | "edit"; src?: Voyage } | null>(null);

  const openNew = () => setDialog({ mode: "new" });
  const openEdit = (v: Voyage) => setDialog({ mode: "edit", src: v });
  // 복제: 기존 일정을 그대로 채워 새 일정으로 저장 (예약/여권 지표는 신청 데이터 기반이라 자동 0)
  const openDuplicate = (v: Voyage) =>
    setDialog({ mode: "new", src: { ...v, title: `${v.title} (복사본)` } });

  const remove = async (id: string, title: string) => {
    if (confirm(`"${title}" 일정을 삭제할까요?`)) {
      await deleteVoyage(id);
    }
  };

  const seed = async () => {
    const n = await seedVoyages();
    alert(n > 0 ? `샘플 ${n}건을 불러왔습니다.` : "이미 데이터가 있습니다.");
  };

  const noCodeCount = voyages.filter((v) => !v.code).length;
  const backfill = async () => {
    if (!confirm(`상품코드가 없는 ${noCodeCount}건에 MC-00001 형식으로 일괄 발번할까요?`)) return;
    const n = await backfillVoyageCodes(voyages);
    alert(`${n}건에 상품코드를 발번했습니다.`);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 max-[991px]:flex-col max-[991px]:gap-3">
        <div>
          <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">운항 일정 운영</h1>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
            각 운항 일정을 선택하여 승객 명단을 관리하세요
          </p>
        </div>
        <div className="flex shrink-0 gap-2 max-[991px]:w-full max-[991px]:flex-wrap">
          {!loading && voyages.length === 0 && (
            <button
              onClick={seed}
              className="rounded-lg border border-slate-300 px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50"
            >
              샘플 불러오기
            </button>
          )}
          {!loading && noCodeCount > 0 && (
            <button
              onClick={backfill}
              className="rounded-lg border border-slate-300 px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50"
            >
              코드 일괄 발번 ({noCodeCount})
            </button>
          )}
          <button
            onClick={openNew}
            className="rounded-lg bg-brand px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-blue-700"
          >
            + 신규 일정 등록
          </button>
        </div>
      </div>

      {/* 승객 이름 검색 */}
      <div className="mb-5">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="승객 이름으로 검색 (예: 홍길동) — 몇월 며칠 어디 가는 팀인지 바로 확인"
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-10 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-700 outline-none focus:border-brand"
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3.5 top-1/2 h-[1.5em] w-[1.5em] -translate-y-1/2 text-slate-400">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          {q && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      {q && (
        <div className="mb-6">
          {searchResults.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
              <b>{q}</b> 승객을 찾을 수 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] text-slate-500">
                검색 결과 <b className="text-brand">{searchResults.length}</b>건
              </p>
              {searchResults.map((r) => (
                <Link
                  key={r.key}
                  href={`/admin/voyages/${r.voyageId}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand hover:bg-brand/5"
                >
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-800">{r.name}</span>
                    {r.phone && <span className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{r.phone}</span>}
                    {r.room && <span className="rounded bg-slate-100 px-2 py-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-500">{r.room}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-navy">{r.departDate} 출발</p>
                      <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-500">{r.voyageTitle}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-navy px-3 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-white">명단 보기</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 권역 필터 (/cruises와 동일 세부 권역) */}
      {!q && !loading && voyages.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {REGION_OPTS.map((opt) => {
            const count = sortedVoyages.filter((v) => matchesRegion(v, opt.value)).length;
            const active = region === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => { setRegion(opt.value); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-semibold transition ${
                  active ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {opt.label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {q ? null : loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : voyages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          등록된 일정이 없습니다. <b>샘플 불러오기</b> 또는 <b>신규 일정 등록</b>으로 시작하세요.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          <b>{REGION_OPTS.find((o) => o.value === region)?.label ?? "선택한"}</b> 권역 일정이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {paged.map((v) => {
            const agg = aggregateForVoyage(reservations, v.id);
            return (
            <div
              key={v.id}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3 max-[991px]:flex-col-reverse max-[991px]:items-start max-[991px]:gap-2">
                <Link
                  href={`/admin/voyages/${v.id}`}
                  className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-800 hover:text-brand"
                >
                  {v.title}
                </Link>
                <div className="flex shrink-0 items-center gap-1.5 max-[991px]:flex-wrap">
                  {v.published === false && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-amber-700">
                      임시저장
                    </span>
                  )}
                  {v.isPrime && (
                    <span className="rounded-md bg-[#C9A961]/15 px-2 py-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-[#C9A961]">
                      ★ 프라임
                    </span>
                  )}
                  <span
                    className={`rounded-md px-2 py-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold ${
                      statusBadge[v.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {v.status}
                  </span>
                  {v.dDay != null && v.dDay >= 0 && v.dDay <= 30 && (
                    <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-orange-600">
                      D-{v.dDay}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-500">
                {/* eslint-disable @next/next/no-img-element */}
                <span className="flex items-center gap-1.5"><img src="/icons/admin/v-calendar.png" alt="" className="h-3.5 w-3.5 object-contain" /> 출항: {v.departDate}</span>
                <span className="flex items-center gap-1.5"><img src="/icons/admin/v-calendar.png" alt="" className="h-3.5 w-3.5 object-contain" /> 귀항: {v.arriveDate}</span>
                <span className="flex items-center gap-1.5"><img src="/icons/admin/v-ship.png" alt="" className="h-3.5 w-3.5 object-contain" /> {v.shipName}</span>
                <span className="flex items-center gap-1.5"><img src="/icons/admin/v-people.png" alt="" className="h-3.5 w-3.5 object-contain" /> {agg.pax}명 예약</span>
                {/* eslint-enable @next/next/no-img-element */}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <Stat color="emerald" label="여권 완료" value={agg.passportDone} />
                  <Stat color="orange" label="미제출" value={agg.passportPending} />
                  <Stat color="sky" label="계약금" value={agg.contractCount} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(v)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => openDuplicate(v)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    복사
                  </button>
                  <button
                    onClick={() => remove(v.id, v.title)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-red-500 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {!q && <Pagination total={filtered.length} pageSize={PAGE_SIZE} page={page} onPage={setPage} />}

      {dialog && (
        <VoyageForm
          mode={dialog.mode}
          initial={dialog.src}
          liveReservedCount={dialog.src ? aggregateForVoyage(reservations, dialog.src.id).reservedCount : 0}
          onClose={() => setDialog(null)}
          onSaved={() => setDialog(null)}
        />
      )}
    </div>
  );
}

function VoyageForm({
  mode,
  initial,
  liveReservedCount,
  onClose,
  onSaved,
}: {
  mode: "new" | "edit";
  initial?: Voyage;
  liveReservedCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<VoyageInput>(
    initial
      ? {
          code: initial.code,
          title: initial.title,
          region: initial.region,
          shipName: initial.shipName,
          line: initial.line,
          departDate: initial.departDate,
          arriveDate: initial.arriveDate,
          nights: initial.nights,
          days: initial.days,
          priceFrom: initial.priceFrom,
          statusManual: initial.statusManual,
          countries: initial.countries ?? [],
          itinerary: initial.itinerary ?? [],
          thumbnail: initial.thumbnail,
          flight: initial.flight,
          description: initial.description,
          features: initial.features ?? [],
          meetingPlace: initial.meetingPlace,
          meetingTime: initial.meetingTime,
          meetingInfo: initial.meetingInfo,
          meetingMapImage: initial.meetingMapImage,
          meetingMapUrl: initial.meetingMapUrl,
          routeMapImage: initial.routeMapImage,
          videos: initial.videos ?? [],
          guide: initial.guide,
          insurance: initial.insurance,
          isPrime: initial.isPrime,
          primeOrder: initial.primeOrder,
          terms: initial.terms ?? [],
          safety: initial.safety ?? [],
          // 복사 시 여행일정도 함께 복사되도록 보관
          itineraryDays: initial.itineraryDays ?? [],
          itineraryStatus: initial.itineraryStatus,
        }
      : empty,
  );
  const [saving, setSaving] = useState(false);
  const { ships } = useShips(); // 선박명·선사를 선박 카드에서 선택

  // 목록 입력은 원문 문자열로 보관하고 저장 시에만 배열로 변환 (입력 중 쉼표/줄바꿈 보존)
  const [countriesRaw, setCountriesRaw] = useState((initial?.countries ?? []).join(", "));
  const [itineraryRaw, setItineraryRaw] = useState((initial?.itinerary ?? []).join(", "));
  // 포함/불포함은 기본값을 미리 채워 폼에서 수정·삭제 (기존 값이 있으면 그 값)
  const [includedRaw, setIncludedRaw] = useState(
    initial?.included?.length ? joinLines(initial.included) : joinLines(DEFAULT_INCLUDED),
  );
  const [excludedRaw, setExcludedRaw] = useState(
    initial?.excluded?.length ? joinLines(initial.excluded) : joinLines(DEFAULT_EXCLUDED),
  );

  const set = (k: keyof VoyageInput, v: unknown) =>
    setF((prev) => ({ ...prev, [k]: v }));

  // 필수값 검증 + 미입력 필드로 포커스 이동
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const regionRef = useRef<HTMLSelectElement>(null);
  const shipRef = useRef<HTMLSelectElement>(null);
  const departRef = useRef<HTMLInputElement>(null);

  // 출발일·귀국일 → 박/일 자동 계산 (일 = 날짜차+1, 박 = 일-2 → 예: 8박10일)
  const calcNightsDays = (dep?: string, arr?: string) => {
    if (!dep || !arr) return null;
    const t1 = new Date(arr + "T00:00:00").getTime();
    const t2 = new Date(dep + "T00:00:00").getTime();
    if (Number.isNaN(t1) || Number.isNaN(t2)) return null; // 입력 중인 부분 날짜 방어
    const diff = Math.round((t1 - t2) / 86400000);
    if (diff < 0) return null;
    const days = diff + 1;
    return { nights: Math.max(days - 2, 0), days };
  };
  const validate = (): boolean => {
    const checks = [
      { ok: !!f.title?.trim(), ref: titleRef, msg: "제목을 입력해 주세요." },
      { ok: !!f.region?.trim(), ref: regionRef, msg: "권역을 선택해 주세요." },
      { ok: !!f.shipName?.trim(), ref: shipRef, msg: "선박명을 선택해 주세요." },
      { ok: !!f.departDate, ref: departRef, msg: "출발일을 선택해 주세요." },
    ];
    const bad = checks.find((c) => !c.ok);
    if (bad) {
      alert(bad.msg);
      bad.ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bad.ref.current?.focus();
      return false;
    }
    return true;
  };

  const save = async (published: boolean) => {
    setSaving(true);
    try {
      // 여행일정(itineraryDays)은 수정 시엔 건드리지 않고(일정 편집기 담당),
      // 신규/복사 시엔 함께 저장 → 복사하면 여행일정도 복사됨
      const { itineraryDays, itineraryStatus, ...rest } = f;
      const payload: VoyageInput = {
        ...rest,
        published, // false=임시저장(고객 미노출), true=발행(공개)
        countries: splitList(countriesRaw),
        itinerary: splitList(itineraryRaw),
        included: splitLines(includedRaw),
        excluded: splitLines(excludedRaw),
      };
      if (mode === "edit" && initial) await updateVoyage(initial.id, payload);
      else await addVoyage({ ...payload, itineraryDays, itineraryStatus });
      onSaved();
    } catch (err) {
      alert("저장 실패: " + (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white px-6 pt-6 pb-0 shadow-xl"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">
            {mode === "edit" ? "일정 수정" : initial ? "일정 복사" : "신규 일정 등록"}
          </h2>
          <button type="button" onClick={onClose} className="shrink-0 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 transition hover:text-slate-600" aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="제목 (Enter로 줄바꿈 가능)" full>
            <textarea
              ref={titleRef}
              className={`${inp} resize-y [field-sizing:content]`}
              rows={2}
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
              required
              placeholder={"*부산출발* 2027년 02월 08일 동북아크루즈\n- MSC [벨리시마호]"}
            />
          </Field>
          <Field label="상품코드">
            <input
              className={`${inp} cursor-not-allowed bg-slate-50 text-slate-400`}
              value={f.code ?? ""}
              readOnly
              placeholder="저장 시 자동 발번 (MC-XXXXX)"
            />
          </Field>
          <Field label="권역">
            <select ref={regionRef} className={inp} value={f.region} onChange={(e) => set("region", e.target.value)}>
              <option value="">권역 선택</option>
              {f.region && !REGION_OPTS.some((o) => o.value === f.region) && (
                <option value={f.region}>{f.region} (기존값)</option>
              )}
              {REGION_OPTS.filter((o) => o.value).map((o) => (
                <option key={o.value} value={o.value as string}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="선박명">
            <select
              ref={shipRef}
              className={inp}
              value={f.shipName}
              onChange={(e) => {
                const name = e.target.value;
                const ship = ships.find((s) => s.name === name);
                setF((p) => ({ ...p, shipName: name, line: ship?.line ?? p.line }));
              }}
            >
              <option value="">선박 카드에서 선택</option>
              {f.shipName && !ships.some((s) => s.name === f.shipName) && (
                <option value={f.shipName}>{f.shipName} (미등록)</option>
              )}
              {ships.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="선사">
            <input
              className={`${inp} cursor-not-allowed bg-slate-50 text-slate-500`}
              value={f.line}
              readOnly
              placeholder="선박 선택 시 자동 입력"
            />
          </Field>
          <Field label="상태">
            <select
              className={inp}
              value={f.statusManual ?? ""}
              onChange={(e) => set("statusManual", e.target.value ? (e.target.value as VoyageStatus) : undefined)}
            >
              <option value="">자동 계산</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {f.departDate && (
              <p className="mt-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                자동: {computeDDay(f.departDate) < 0 ? "출발 경과" : `D-${computeDDay(f.departDate)}`} ·{" "}
                {f.statusManual ?? computeStatus(f.departDate, liveReservedCount)}
                {f.statusManual ? " (직접 지정됨)" : ""}
              </p>
            )}
          </Field>
          <Field label="출발일">
            <DateInput
              inputRef={departRef}
              value={f.departDate}
              onChange={(d) => {
                setF((p) => {
                  // 출발일이 귀국일보다 뒤면 귀국일을 출발일로 맞춤
                  const arr = p.arriveDate && p.arriveDate < d ? d : p.arriveDate;
                  const nd = calcNightsDays(d, arr);
                  return { ...p, departDate: d, arriveDate: arr, ...(nd ?? {}) };
                });
              }}
            />
          </Field>
          <Field label="귀국일">
            <DateInput
              value={f.arriveDate}
              min={f.departDate || undefined}
              onChange={(d) => {
                setF((p) => {
                  // 귀국일은 항상 출발일 이후
                  const arr = p.departDate && d && d < p.departDate ? p.departDate : d;
                  const nd = calcNightsDays(p.departDate, arr);
                  return { ...p, arriveDate: arr, ...(nd ?? {}) };
                });
              }}
            />
          </Field>
          <Field label="박">
            <input type="number" className={inp} value={f.nights} onChange={(e) => set("nights", +e.target.value)} />
          </Field>
          <Field label="일">
            <input type="number" className={inp} value={f.days} onChange={(e) => set("days", +e.target.value)} />
          </Field>
          <Field label="상품가">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                className={`${inp} pr-10`}
                value={f.priceFrom ? f.priceFrom.toLocaleString("ko-KR") : ""}
                placeholder="0"
                onChange={(e) => set("priceFrom", Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">원</span>
            </div>
          </Field>
          {/* 객실별 요금 — 직접 입력(타이핑). 비우면 상품가×배수 자동계산 */}
          <Field label="객실별 요금 (비우면 자동계산)" full>
            <div className="grid grid-cols-2 gap-2">
              {["내측", "오션뷰", "발코니", "스위트"].map((rt) => (
                <div key={rt} className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.9em] font-medium text-slate-500">{rt}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`${inp} pl-16 pr-8 text-right`}
                    value={f.roomPrices?.[rt] ? f.roomPrices[rt].toLocaleString("ko-KR") : ""}
                    placeholder="자동"
                    onChange={(e) => {
                      const val = Number(e.target.value.replace(/[^\d]/g, "")) || 0;
                      const rp: Record<string, number> = { ...(f.roomPrices ?? {}) };
                      if (val > 0) rp[rt] = val;
                      else delete rp[rt];
                      set("roomPrices", Object.keys(rp).length ? rp : undefined);
                    }}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">원</span>
                </div>
              ))}
            </div>
          </Field>
          <div className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
            예약 인원·여권 완료·미제출·계약금은 사용자의 가예약 신청 데이터에서 자동 집계됩니다.
          </div>
          <Field label="국가 (쉼표로 구분)" full>
            <input className={inp} value={countriesRaw} onChange={(e) => setCountriesRaw(e.target.value)} placeholder="이탈리아, 프랑스, 스페인" />
          </Field>
          <Field label="기항지 (쉼표로 구분)" full>
            <input className={inp} value={itineraryRaw} onChange={(e) => setItineraryRaw(e.target.value)} placeholder="로마, 제노아, 마르세유 …" />
          </Field>
          <Field label="대표 이미지" full>
            <ImageUploader
              value={f.thumbnail}
              onChange={(v) => set("thumbnail", v)}
              dir="voyages"
              label="대표 이미지를 끌어다 놓거나 클릭하여 업로드"
            />
          </Field>


          {/* ── 상세(예약) 페이지 콘텐츠 ─────────────────────── */}
          <div className="col-span-2 mt-2 border-t border-slate-200 pt-4">
            <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-slate-700">상세 페이지 설정</p>
            <p className="mt-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
              비워두면 기본값으로 표시됩니다. 목록 항목은 한 줄에 하나씩 입력하세요.
            </p>
          </div>

          {/* 상세페이지 탭 순서와 동일하게 배치 */}
          <p className="col-span-2 mt-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-bold text-[#1E4D8B]">① 주요 여행일정</p>
          <Field label="항공편">
            <input className={inp} value={f.flight ?? ""} onChange={(e) => set("flight", e.target.value || undefined)} placeholder="아시아나 OZ202" />
          </Field>
          <Field label="인솔자 (요약정보)">
            <input className={inp} value={f.guide ?? ""} onChange={(e) => set("guide", e.target.value || undefined)} placeholder="전 일정 전문 인솔자 동행" />
          </Field>
          <Field label="여행자보험 (요약정보)">
            <input className={inp} value={f.insurance ?? ""} onChange={(e) => set("insurance", e.target.value || undefined)} placeholder="포함 (질병/상해 보장)" />
          </Field>

          <p className="col-span-2 mt-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-bold text-[#1E4D8B]">② 포함 · 불포함 요약</p>
          <Field label="포함 사항 (한 줄에 하나 · 기본값에서 수정·삭제)" full>
            <textarea className={inp} rows={5} value={includedRaw} onChange={(e) => setIncludedRaw(e.target.value)} />
          </Field>
          <Field label="불포함 사항 (한 줄에 하나 · 기본값에서 수정·삭제)" full>
            <textarea className={inp} rows={5} value={excludedRaw} onChange={(e) => setExcludedRaw(e.target.value)} />
          </Field>

          <p className="col-span-2 mt-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-bold text-[#1E4D8B]">③ 미팅장소</p>
          <Field label="미팅 장소">
            <input className={inp} value={f.meetingPlace ?? ""} onChange={(e) => set("meetingPlace", e.target.value || undefined)} placeholder="인천국제공항 제2터미널" />
          </Field>
          <Field label="미팅 시간">
            <input className={inp} value={f.meetingTime ?? ""} onChange={(e) => set("meetingTime", e.target.value || undefined)} placeholder="출발 3시간 전 (구체적인 시간은 출발 7일 전 안내)" />
          </Field>
          <Field label="미팅 안내문" full>
            <textarea className={inp} rows={2} value={f.meetingInfo ?? ""} onChange={(e) => set("meetingInfo", e.target.value || undefined)} placeholder="담당 인솔자가 미팅 장소에서 안내 피켓을 들고 대기합니다 …" />
          </Field>
          <Field label="미팅장소 지도 URL (지도보기 → 새 탭)" full>
            <input className={inp} value={f.meetingMapUrl ?? ""} onChange={(e) => set("meetingMapUrl", e.target.value || undefined)} placeholder="https://maps.google.com/?q=인천국제공항 제2터미널" />
          </Field>
          <Field label="미팅장소 지도 이미지" full>
            <ImageUploader
              value={f.meetingMapImage}
              onChange={(v) => set("meetingMapImage", v)}
              dir="maps"
              label="미팅장소 지도 이미지를 끌어다 놓거나 클릭하여 업로드"
            />
          </Field>

          <p className="col-span-2 mt-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-bold text-[#1E4D8B]">④ 지도정보 / 항로</p>
          <Field label="지도정보 / 항로 이미지" full>
            <ImageUploader
              value={f.routeMapImage}
              onChange={(v) => set("routeMapImage", v)}
              dir="maps"
              label="항로/지도 이미지를 끌어다 놓거나 클릭하여 업로드"
            />
          </Field>

          <p className="col-span-2 mt-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-bold text-[#1E4D8B]">⑤ 영상으로 만나는 크루즈</p>
          <Field label="영상 (YouTube URL 또는 영상 파일 업로드)" full>
            {(f.videos ?? []).map((vid, i) => (
              <div key={i} className="mb-2 flex flex-wrap items-center gap-2">
                <input
                  className={`${inp} w-40`}
                  placeholder="제목"
                  value={vid.label}
                  onChange={(e) => set("videos", (f.videos ?? []).map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))}
                />
                <input
                  className={`${inp} min-w-0 flex-1`}
                  placeholder="영상 URL (YouTube 등)"
                  value={vid.url}
                  onChange={(e) => set("videos", (f.videos ?? []).map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))}
                />
                <button
                  type="button"
                  onClick={() => set("videos", (f.videos ?? []).filter((_, idx) => idx !== i))}
                  className="shrink-0 rounded-md bg-red-50 px-3 py-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-red-500 hover:bg-red-100"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set("videos", [...(f.videos ?? []), { label: "", url: "" }])}
              className="mb-3 rounded-md border border-slate-200 px-3 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50"
            >
              + URL 직접 입력
            </button>
            <ImageUploader
              video
              multiple
              value={[]}
              onChange={(urls) => set("videos", [...(f.videos ?? []), ...urls.map((u, k) => ({ label: `영상 ${(f.videos ?? []).length + k + 1}`, url: u }))])}
              dir="videos"
              label="영상 파일을 끌어다 놓거나 클릭하여 업로드"
            />
          </Field>

          <p className="col-span-2 mt-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-bold text-slate-500">기타 설정</p>
          <Field label="프라임 상품" full>
            <label className="flex items-center gap-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-600">
              <input type="checkbox" checked={!!f.isPrime} onChange={(e) => set("isPrime", e.target.checked)} className="h-4 w-4 accent-[#1E4D8B]" />
              프라임 페이지에 노출 (일정 목록에도 함께 노출 · 순서는 프라임 상품 관리에서 조정)
            </label>
          </Field>
        </div>

        <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">
            취소
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              // 이미 공개 중인 상품을 임시저장하면 고객 화면에서 내려가므로 경고
              const currentlyPublic = mode === "edit" && initial != null && initial.published !== false;
              if (currentlyPublic && !confirm("이미 발행된(공개 중인) 상품입니다.\n임시저장하면 고객 화면(홈·크루즈 일정)에서 내려갑니다.\n계속할까요?")) return;
              save(false);
            }}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? "저장 중…" : "임시저장"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              if (!validate()) return; // 필수값 미입력 시 해당 필드로 포커스
              if (confirm("이 상품을 발행할까요?\n발행하면 고객 화면(홈·크루즈 일정)에 즉시 노출됩니다.")) save(true);
            }}
            className="rounded-lg bg-brand px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "저장 중…" : "발행"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inp =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-[1.25em] outline-none focus:border-brand";

/** 날짜 입력 — 숫자 키보드로 YYYY-MM-DD 직접 타이핑(자동 하이픈) + 달력 버튼 병행 */
function DateInput({
  value,
  min,
  onChange,
  inputRef,
}: {
  value: string;
  min?: string;
  onChange: (v: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const mask = (raw: string) => {
    const d = raw.replace(/\D/g, "").slice(0, 8); // 숫자만 8자리(YYYYMMDD)
    return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join("-");
  };
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        maxLength={10}
        className={inp + " pr-10"}
        value={value}
        onChange={(e) => onChange(mask(e.target.value))}
      />
      {/* 달력 피커(숨김) — 버튼으로 열기 */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 h-0 w-0 -translate-y-1/2 opacity-0"
      />
      <button
        type="button"
        aria-label="달력 열기"
        onClick={() => pickerRef.current?.showPicker?.()}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-brand"
      >
        <svg viewBox="0 0 24 24" className="h-[1.2em] w-[1.2em]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>
    </div>
  );
}

function splitList(s: string) {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

// 줄 단위 목록 ↔ 문자열
function joinLines(arr?: string[]) {
  return (arr ?? []).join("\n");
}
function splitLines(s: string): string[] {
  return s.split("\n").map((x) => x.trim()).filter(Boolean);
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}

const statColor: Record<string, string> = {
  emerald: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  sky: "bg-sky-50 text-sky-600",
};

function Stat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-medium ${statColor[color]}`}>
      <span>{color === "orange" ? "⏱" : "✓"}</span>
      {label} {value}명
    </span>
  );
}
