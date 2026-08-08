"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import Link from "next/link";
import type { ItineraryBlock, ItineraryBlockType, ItineraryDay, ItineraryDraft, Voyage, FlightSegment } from "@/lib/types";
import { updateVoyage } from "@/lib/voyages";
import { updatePort } from "@/lib/ports";
import { useVoyages } from "@/lib/useVoyages";
import { usePorts } from "@/lib/usePorts";
import ImageUploader from "@/components/ImageUploader";
import ItineraryView from "@/components/site/ItineraryView";
import { BLOCK_META, BLOCK_ORDER, BLOCK_FIELDS, BLOCK_STYLE, isRichField } from "@/lib/itinerary-blocks";
import RichText from "@/components/admin/RichText";

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// 임시저장 스냅샷 최대 보관 개수 (초과 시 오래된 것부터 제거)
const MAX_DRAFTS = 20;
// 저장 시각 표시용 스탬프 (로컬/KST 기준, 예: "2026-07-31 15:56")
const nowStamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Firestore 저장용 정리 — undefined 를 깊게 제거하고, 잘못 생긴 중첩 배열(배열 안의 배열,
// Firestore 미지원 → "invalid nested entity" 오류)은 평탄화해서 저장 가능하게 복구한다.
function firestoreSafeDays(days: ItineraryDay[]): ItineraryDay[] {
  const sanitize = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      const out: unknown[] = [];
      for (const item of value) {
        const s = sanitize(item);
        if (s === undefined) continue;
        if (Array.isArray(s)) {
          // 중첩 배열 → 평탄화(원소 복구)
          if (typeof console !== "undefined") console.warn("[일정저장] 중첩 배열 평탄화됨");
          out.push(...s);
        } else {
          out.push(s);
        }
      }
      return out;
    }
    if (value && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const s = sanitize(v);
        if (s !== undefined) out[k] = s;
      }
      return out;
    }
    return value;
  };
  return sanitize(days) as ItineraryDay[];
}

// 커스텀 점선 테두리 (dash 길이 지정) — SVG 배경으로 그린다. stroke 는 # 없는 hex.
const dashed = (stroke: string, width: number, dash: string, radius: number) => ({
  borderRadius: radius,
  backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' stroke='%23${stroke}' stroke-width='${width}' stroke-dasharray='${dash}' rx='${radius}' ry='${radius}'/%3e%3c/svg%3e")`,
});

// 블록 메타·필드는 공유 모듈(상세 뷰와 동일) 기준 — 한 곳만 바꾸면 둘 다 반영된다.
// 모든 타입 스펙(구버전 "air" 포함) — specOf가 어떤 타입이든 찾도록
const BLOCK_SPECS = (Object.keys(BLOCK_FIELDS) as ItineraryBlockType[]).map((type) => ({
  type,
  ...BLOCK_META[type],
  fields: BLOCK_FIELDS[type],
  image: type === "image",
}));

const specOf = (t: ItineraryBlockType) => BLOCK_SPECS.find((s) => s.type === t)!;

// 24시 시/분 드롭다운 (오전/오후 없이) — 저장값 "HH:MM"
function TimeSelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const parts = (value || "").split(":");
  const h = parts[0] ?? "";
  const m = parts[1] ?? "";
  const setHM = (nh: string, nm: string) => {
    if (!nh && !nm) return onChange("");
    onChange(`${(nh || "00").padStart(2, "0")}:${(nm || "00").padStart(2, "0")}`);
  };
  const sel = "rounded-[10px] bg-[#F9FAFB] px-2 py-2 text-[0.875em] max-[501px]:text-[2.4vw] font-medium text-[#364153] outline-none transition focus:bg-white";
  return (
    <div className="flex items-center gap-1">
      <select value={h} onChange={(e) => setHM(e.target.value, m)} className={sel} style={{ fontFamily: "Inter, var(--font-sans)" }}>
        <option value="">시</option>
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((hh) => (
          <option key={hh} value={hh}>{hh}</option>
        ))}
      </select>
      <span className="text-slate-400">:</span>
      <select value={m} onChange={(e) => setHM(h, e.target.value)} className={sel} style={{ fontFamily: "Inter, var(--font-sans)" }}>
        <option value="">분</option>
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((mm) => (
          <option key={mm} value={mm}>{mm}</option>
        ))}
      </select>
    </div>
  );
}
// 블록 추가 메뉴에 노출할 스펙(BLOCK_ORDER 순서 — 구버전 "air" 제외)
const MENU_SPECS = BLOCK_ORDER.map((t) => specOf(t));

// 총 일수 = 귀국일 - 출발일 (포함, 예: 5/15~5/24 → 10일)
function tripDays(dep?: string, arr?: string): number {
  if (!dep || !arr) return 0;
  const d1 = new Date(dep + "T00:00:00").getTime();
  const d2 = new Date(arr + "T00:00:00").getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  const diff = Math.round((d2 - d1) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}
// 식사 블록을 각 일차 맨 아래(마지막)에 하나만 두도록 정규화
function withMealLast(d: ItineraryDay): ItineraryDay {
  const others = d.blocks.filter((b) => b.type !== "meal");
  const meal = d.blocks.find((b) => b.type === "meal") ?? { id: uid(), type: "meal" as const };
  return { ...d, blocks: [...others, meal] };
}
// 출발/귀국일 기준 일차 수만큼 채우고(부족분 추가), 각 일차에 식사 고정
function normalizeDays(existing: ItineraryDay[], total: number): ItineraryDay[] {
  const out = existing.map((d) => ({ ...d }));
  while (out.length < total) out.push({ id: uid(), dayNo: out.length, blocks: [] });
  return out.map((d, i) => withMealLast({ ...d, dayNo: i }));
}

export default function ItineraryEditor({ voyage }: { voyage: Voyage }) {
  const [days, setDays] = useState<ItineraryDay[]>(() =>
    // 미발행 초안(itineraryDaysDraft)이 있으면 이어서 편집, 없으면 발행본(itineraryDays)에서 시작
    normalizeDays(voyage.itineraryDaysDraft ?? voyage.itineraryDays ?? [], tripDays(voyage.departDate, voyage.arriveDate)),
  );
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savingKind, setSavingKind] = useState<null | "draft" | "published">(null); // 어느 버튼을 저장 중인지
  const [savedAt, setSavedAt] = useState<string>("");
  const [addAt, setAddAt] = useState<number | null>(null); // 블록 삽입 위치 인덱스 (null=닫힘)
  // 블록 추가 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (addAt === null) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-add-menu]")) setAddAt(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [addAt]);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedPopup, setSavedPopup] = useState<null | "draft" | "published">(null);
  // 임시저장 스냅샷 목록 + 목록 팝오버 열림 상태
  const [drafts, setDrafts] = useState<ItineraryDraft[]>(voyage.itineraryDrafts ?? []);
  const [draftListOpen, setDraftListOpen] = useState(false);
  // 임시저장 목록 팝오버 바깥 클릭 시 닫기
  useEffect(() => {
    if (!draftListOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-draft-menu]")) setDraftListOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [draftListOpen]);
  const { ports } = usePorts();
  // 마지막 저장 시점의 tour 카드 id 집합 (일정에서 제거된 카드만 연결 해제하기 위함)
  const savedTourRefs = useRef<Set<string>>(
    new Set(
      (voyage.itineraryDays ?? [])
        .flatMap((d) => d.blocks)
        .filter((b) => b.type === "tour" && b.tourCardId)
        .map((b) => b.tourCardId as string),
    ),
  );

  const cur = days[active];
  // 식사는 타임라인에서 제외하고 맨 아래 고정 (meal은 항상 마지막 블록)
  const curTimeline = cur ? cur.blocks.filter((b) => b.type !== "meal") : [];
  const curMeal = cur?.blocks.find((b) => b.type === "meal");

  const addDay = () => {
    setDays((d) => [...d, { id: uid(), dayNo: d.length, blocks: [{ id: uid(), type: "meal" }] }]);
    setActive(days.length);
  };

  const removeDay = (id: string) => {
    setDays((d) => d.filter((x) => x.id !== id).map((x, i) => ({ ...x, dayNo: i })));
    setActive((a) => Math.max(0, a - 1));
  };

  // 현재 일차를 이웃 일차와 통째로 맞바꿈 (내용 그대로, 일차 번호만 재배치).
  // 예: 1일차 ↔ 2일차 — 1일차 내용이 2일차로, 2일차 내용이 1일차로 이동.
  const moveDay = (dir: -1 | 1) => {
    const j = active + dir;
    if (j < 0 || j >= days.length) return;
    setDays((d) => {
      const next = [...d];
      [next[active], next[j]] = [next[j], next[active]];
      return next.map((x, i) => ({ ...x, dayNo: i }));
    });
    setActive(j); // 이동한 일차를 계속 보여줌
  };

  // 임시저장 스냅샷 불러오기 — 해당 저장시점의 전체 일정으로 교체
  const restoreDraft = (d: ItineraryDraft) => {
    if (!confirm(`${d.savedAt} 임시저장 시점으로 되돌릴까요?\n현재 편집 중인 내용은 사라집니다.`)) return;
    setDays(normalizeDays(d.days, tripDays(voyage.departDate, voyage.arriveDate)));
    setActive(0);
    setDraftListOpen(false);
  };

  // 임시저장 스냅샷 삭제
  const deleteDraft = async (id: string) => {
    if (!confirm("이 임시저장 기록을 삭제할까요?")) return;
    const next = drafts.filter((x) => x.id !== id);
    setDrafts(next);
    try {
      await updateVoyage(voyage.id, { itineraryDrafts: next });
    } catch (e) {
      alert("삭제 실패: " + (e instanceof Error ? e.message : ""));
    }
  };

  const addBlockAt = (index: number, type: ItineraryBlockType) => {
    if (!cur) return;
    const block: ItineraryBlock = { id: uid(), type };
    // 날짜 기본값 = 해당 일차(행사 당일) 날짜 — 1일차/2일차마다 다름
    let dayDate = "";
    if (voyage.departDate) {
      const dt = new Date(voyage.departDate + "T00:00:00");
      if (!isNaN(dt.getTime())) {
        dt.setDate(dt.getDate() + cur.dayNo);
        // 로컬 날짜로 포맷 (toISOString은 UTC 변환으로 하루 밀림)
        dayDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      }
    }
    if (dayDate) {
      if (type === "airDepart" || type === "air") block.dateDepart = dayDate;
      if (type === "airArrive" || type === "air") block.dateArrive = dayDate;
    }
    // 항공사/편명 기본값 = 운항일정운영의 항공편(voyage.flight)
    if ((type === "airDepart" || type === "airArrive" || type === "air") && voyage.flight) {
      block.airline = voyage.flight;
    }
    // 항공(경유 포함) 블록 — 첫 구간 기본값(항공편·출발일)
    if (type === "flight") {
      block.segments = [{ airline: voyage.flight || undefined, dateDepart: dayDate || undefined }];
    }
    setDays((d) =>
      d.map((x) =>
        x.id === cur.id ? { ...x, blocks: [...x.blocks.slice(0, index), block, ...x.blocks.slice(index)] } : x,
      ),
    );
    setAddAt(null);
  };

  const patchBlock = (blockId: string, patch: Partial<ItineraryBlock>) => {
    if (!cur) return;
    setDays((d) =>
      d.map((x) =>
        x.id === cur.id
          ? { ...x, blocks: x.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)) }
          : x,
      ),
    );
  };

  const removeBlock = (blockId: string) => {
    if (!cur) return;
    setDays((d) =>
      d.map((x) => (x.id === cur.id ? { ...x, blocks: x.blocks.filter((b) => b.id !== blockId) } : x)),
    );
  };

  const moveBlock = (blockId: string, dir: -1 | 1) => {
    if (!cur) return;
    setDays((d) =>
      d.map((x) => {
        if (x.id !== cur.id) return x;
        const i = x.blocks.findIndex((b) => b.id === blockId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= x.blocks.length) return x;
        const blocks = [...x.blocks];
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        return { ...x, blocks };
      }),
    );
  };

  const save = async (status: "draft" | "published" = "draft") => {
    setSaving(true);
    setSavingKind(status);
    try {
      const clean = firestoreSafeDays(days);

      // ── 임시저장: 저장 시점별 스냅샷을 리스트에 추가(최근 MAX_DRAFTS개 유지). 발행본·공개상태·관광카드 연결은 건드리지 않음 ──
      if (status === "draft") {
        const snapshot: ItineraryDraft = { id: uid(), savedAt: nowStamp(), days: clean };
        const nextDrafts = [...drafts, snapshot].slice(-MAX_DRAFTS);
        await updateVoyage(voyage.id, { itineraryDaysDraft: clean, itineraryDrafts: nextDrafts });
        setDrafts(nextDrafts);
        setSavedAt("임시저장됨");
        setSavedPopup("draft");
        return;
      }

      // ── 발행: 발행본(itineraryDays)에 반영 + 공개 (초안은 작업본으로 유지) ──
      const sibIds = [voyage.id];
      await updateVoyage(voyage.id, {
        itineraryDays: clean,
        itineraryStatus: "published",
      });

      // 관광정보(tour) 블록 ↔ 관광정보 카드 voyageIds 동기화 (발행본 기준)
      const curr = new Set<string>();
      clean.forEach((d) =>
        d.blocks.forEach((b) => {
          if (b.type === "tour" && b.tourCardId) curr.add(b.tourCardId);
        }),
      );
      const prev = savedTourRefs.current;
      const sibSet = new Set(sibIds);
      await Promise.all(
        ports.map((card) => {
          const ids = new Set(card.voyageIds ?? []);
          if (curr.has(card.id)) {
            const missing = sibIds.filter((id) => !ids.has(id));
            if (missing.length) return updatePort(card.id, { voyageIds: [...(card.voyageIds ?? []), ...missing] });
          } else if (prev.has(card.id)) {
            if (sibIds.some((id) => ids.has(id)))
              return updatePort(card.id, { voyageIds: (card.voyageIds ?? []).filter((id) => !sibSet.has(id)) });
          }
          return null;
        }),
      );
      savedTourRefs.current = curr;

      setSavedAt("발행됨");
      setSavedPopup("published");
    } catch (e) {
      alert("저장에 실패했습니다.\n" + (e instanceof Error ? e.message : ""));
    } finally {
      setSaving(false);
      setSavingKind(null);
    }
  };

  // 블록 타입 선택 메뉴 (index 위치에 삽입)
  const addMenu = (index: number) =>
    addAt === index ? (
      <div data-add-menu className="mb-3 grid grid-cols-6 gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm max-[991px]:grid-cols-3">
        {MENU_SPECS.map((s) => (
          <button
            key={s.type}
            onClick={() => addBlockAt(index, s.type)}
            className="flex flex-col items-center gap-1 rounded-lg border border-slate-100 py-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 transition hover:border-[#1E4D8B] hover:bg-slate-50"
          >
            {s.type === "tour" ? (
              <span className="grid h-7 w-7 place-items-center rounded-[8px]" style={{ backgroundColor: s.iconBg }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.icon} alt="" className="h-5 w-5 object-contain" />
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.icon} alt="" className="h-7 w-7 object-contain" />
            )}
            {s.label}
          </button>
        ))}
      </div>
    ) : null;

  // 블록 사이 hover 삽입 존
  const insertZone = (index: number) => (
    <div className="group relative flex h-5 items-center">
      <button
        type="button"
        data-add-menu
        onClick={() => setAddAt(addAt === index ? null : index)}
        className={`inline-flex items-center gap-1 rounded-md border border-dashed border-[#E5E7EB] bg-white px-2.5 py-1 text-[min(0.99vw,19.008px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[3.7446vw] font-medium transition ${
          addAt === index ? "text-[#1E4D8B] opacity-100" : "text-[#99A1AF] opacity-0 group-hover:opacity-100"
        } hover:text-[#1E4D8B]`}
      >
        + 블록 추가
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl text-[17px] max-[991px]:text-[13px]">
      {/* 상단 바 */}
      <div className="mb-3 flex items-center justify-between gap-2 max-[991px]:flex-wrap">
        <Link href="/admin/itinerary" className="whitespace-nowrap text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-500 hover:text-navy">
          ← 여행 일정 관리
        </Link>
        <div className="flex items-center gap-2 [&>button]:whitespace-nowrap max-[991px]:gap-1.5 max-[991px]:[&>button]:px-2.5">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setReuseOpen(true)}
            className="rounded-lg border border-[#1E4D8B]/30 bg-white px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-[#1E4D8B] transition hover:bg-[#1E4D8B]/5"
          >
            ⧉ 일정 재사용
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => save("draft")}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {savingKind === "draft" ? "저장 중…" : "임시저장"}
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPreviewOpen(true)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            미리보기
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => save("published")}
            disabled={saving}
            className="rounded-lg bg-[#1E4D8B] px-5 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {savingKind === "published" ? "저장 중…" : "발행"}
          </button>
        </div>
      </div>

      {/* 제목 */}
      <div className="mb-6">
        <h1 className="flex flex-wrap items-center gap-2 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-extrabold text-navy">
          여행 일정 작성
          {voyage.itineraryStatus === "published" ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.4308em] font-semibold text-emerald-700">🟢 발행본 노출 중</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.4308em] font-semibold text-slate-500">⚪ 미발행</span>
          )}
          {drafts.length > 0 && (
            <span className="relative text-[0.4308em]" data-draft-menu>
              <button
                type="button"
                onClick={() => setDraftListOpen((v) => !v)}
                className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700 transition hover:bg-amber-200"
              >
                ✏️ 임시저장 {drafts.length}개 ▾
              </button>
              {draftListOpen && (
                <div
                  data-draft-menu
                  className="absolute left-0 max-[991px]:left-auto max-[991px]:right-0 top-[calc(100%+6px)] z-30 max-h-[60vh] w-[400px] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 text-[14px] font-normal text-slate-700 shadow-xl max-[501px]:w-[240px] max-[501px]:text-[13px]"
                >
                  <p className="px-2 py-1.5 text-[13px] font-semibold text-slate-400 max-[501px]:text-[12px]">임시저장 기록 (최근순) — 클릭 시 그 시점으로 되돌리기</p>
                  {[...drafts].reverse().map((d) => (
                    <div key={d.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <button type="button" onClick={() => restoreDraft(d)} className="min-w-0 flex-1 text-left">
                        <span className="block truncate font-semibold text-slate-700">🕒 {d.savedAt}</span>
                        <span className="block text-[12px] text-slate-400 max-[501px]:text-[11px]">{d.days.length}일차 · 이 시점으로 되돌리기</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDraft(d.id)}
                        className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[12px] font-semibold text-red-400 transition hover:border-red-300 hover:text-red-500 max-[501px]:text-[11px]"
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </span>
          )}
          {savedAt && <span className="rounded-full bg-[#FEF3C6] px-2.5 py-1 text-[0.4308em] font-medium text-[#BB4D00]">{savedAt}</span>}
        </h1>
        <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          크루즈 여행 일정을 일차별로 구성하고, 항공·선박·숙소·식사·이미지·텍스트 블록을 삽입할 수 있는 에디터입니다.
        </p>
        <p className="mt-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-[#BB4D00]">
          ※ <b>임시저장</b>은 사이트에 노출되지 않습니다. 일정 완성 후 <b>발행</b>해야 상세페이지에 공개됩니다.
        </p>
      </div>

      {/* 상품 요약 */}
      <div className="mb-8 flex items-center gap-x-8 max-[501px]:gap-x-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[2.4965vw] whitespace-nowrap font-medium text-slate-400">상품명</p>
          <p className="mt-1 truncate text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1255px)] max-[501px]:text-[3.7446vw] font-bold text-navy">{voyage.title}</p>
        </div>
        <div>
          <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[2.4965vw] whitespace-nowrap font-medium text-slate-400">출발일</p>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9872px)] max-[501px]:text-[2.9126vw] font-semibold text-slate-700">{voyage.departDate || "—"}</p>
        </div>
        <div>
          <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[2.4965vw] whitespace-nowrap font-medium text-slate-400">귀국일</p>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9872px)] max-[501px]:text-[2.9126vw] font-semibold text-slate-700">{voyage.arriveDate || "—"}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[2.4965vw] whitespace-nowrap font-medium text-slate-400">총 일수</p>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9872px)] max-[501px]:text-[2.9126vw] font-bold text-[#1E4D8B]">{days.length}일차 구성</p>
        </div>
      </div>

      {/* 일차 탭 — 상단 고정(아래에서 입력 후에도 바로 클릭 가능) */}
      <div className="sticky top-0 z-20 mb-5 flex items-center gap-2 border-b border-slate-100 bg-white py-2 max-[991px]:flex-col-reverse max-[991px]:items-end max-[991px]:gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
          {days.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setActive(i)}
              className={`w-[5em] shrink-0 rounded-full py-1.5 text-center text-[min(1.0313vw,19.8px)] max-[991px]:text-[min(3.2vw,19.2px)] max-[501px]:text-[3.1206vw] font-bold transition ${
                i === active ? "bg-navy text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {d.dayNo + 1}일차
            </button>
          ))}
        </div>
        {cur && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => moveDay(-1)}
              disabled={active === 0}
              className="rounded-md border border-slate-200 px-2 py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500 transition hover:border-[#1E4D8B] hover:text-[#1E4D8B] disabled:cursor-not-allowed disabled:opacity-40"
              title="현재 일차를 앞 일차와 맞바꿈"
            >
              ◀ 앞으로
            </button>
            <button
              onClick={() => moveDay(1)}
              disabled={active === days.length - 1}
              className="rounded-md border border-slate-200 px-2 py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500 transition hover:border-[#1E4D8B] hover:text-[#1E4D8B] disabled:cursor-not-allowed disabled:opacity-40"
              title="현재 일차를 뒤 일차와 맞바꿈"
            >
              뒤로 ▶
            </button>
            <button
              onClick={() => removeDay(cur.id)}
              className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-red-400 hover:text-red-500"
            >
              현재 일차 삭제
            </button>
          </div>
        )}
      </div>

      {/* 블록 리스트 — 상세페이지 여행일정과 동일한 글자 크기(var(--font-base)·데스크톱 1.18em) */}
      {cur ? (
        <div className="min-[991px]:text-[1.18em]" style={{ fontSize: "var(--font-base)" }}>
          {/* 타임라인 (좌측 점 + 점선 연결) */}
          <div className="relative flex flex-col pl-5">
            {/* 점 왼쪽 세로선 (1px #E5E7EB) */}
            {curTimeline.length > 0 && (
              <span className="pointer-events-none absolute bottom-0 left-[5px] top-0 w-px bg-[#E5E7EB]" />
            )}
            {curTimeline.map((b, i) => (
              <Fragment key={b.id}>
                {/* 블록 앞 삽입 존 */}
                <div className="pl-7">
                  {insertZone(i)}
                  {addMenu(i)}
                </div>
                <div className="flex gap-3">
                  <div className="relative flex w-4 shrink-0 justify-center">
                    <span className="relative mt-4 grid h-4 w-4 place-items-center rounded-full bg-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_0px_#0000001a]">
                      <span className={`h-[9px] w-[9px] rounded-full ${BLOCK_META[b.type].dot}`} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 pb-5">
                    <BlockCard
                      block={b}
                      voyageTitle={voyage.title}
                      voyageFlight={voyage.flight}
                      onPatch={(p) => patchBlock(b.id, p)}
                      onRemove={() => removeBlock(b.id)}
                      onMove={(dir) => moveBlock(b.id, dir)}
                    />
                  </div>
                </div>
              </Fragment>
            ))}
          </div>

          {/* 맨 끝 블록 추가 (식사 앞에 삽입) */}
          <div className="pl-6">
            {addMenu(curTimeline.length)}
            <button
              data-add-menu
              onClick={() => setAddAt(addAt === curTimeline.length ? null : curTimeline.length)}
              style={dashed("E5E7EB", 1, "2 1", 10)}
              className="inline-flex items-center gap-1.5 px-5 py-3 text-[min(0.99vw,19.008px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[3.7446vw] font-medium text-[#99A1AF] transition hover:text-[#1E4D8B]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/plus.png" alt="" className="h-3 w-3 object-contain" />
              블록 추가
            </button>
          </div>

          {/* 식사 — 각 일차 맨 아래 고정 */}
          {curMeal && (
            <div className="mt-2 flex gap-3 border-t border-slate-100 pt-4">
              <div className="relative flex w-4 shrink-0 justify-center">
                <span className="relative mt-1 grid h-4 w-4 place-items-center rounded-full bg-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_0px_#0000001a]">
                  <span className={`h-[9px] w-[9px] rounded-full ${BLOCK_META.meal.dot}`} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-[min(1.1088vw,21.2889px)] max-[991px]:text-[min(2.806vw,16.836px)] max-[501px]:text-[3.4077vw] font-bold text-[#D97706]">식사</p>
                <MealEdit block={curMeal} onPatch={(p) => patchBlock(curMeal.id, p)} />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          아직 일차가 없습니다. 아래 버튼으로 첫 일차를 추가하세요.
        </div>
      )}

      {/* 일차 추가 */}
      <button
        onClick={addDay}
        style={dashed("C6CAD1", 2, "4 2", 14)}
        className="mt-6 flex w-full items-center justify-center gap-2 py-4 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-medium text-[#99A1AF] transition hover:text-[#1E4D8B]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/plus.png" alt="" className="h-5 w-5 object-contain" />
        일차 추가
      </button>

      {reuseOpen && (
        <ReuseModal
          currentId={voyage.id}
          days={days}
          onLoad={(loaded) => {
            setDays(loaded);
            setActive(0);
          }}
          onClose={() => setReuseOpen(false)}
        />
      )}

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-slate-800">여행 일정 미리보기</h2>
                <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">실제 상세페이지의 여행일정 영역에 표시되는 모습입니다.</p>
              </div>
              <button onClick={() => setPreviewOpen(false)} className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-y-auto bg-white px-6 py-6 min-[991px]:text-[1.18em]" style={{ fontSize: "var(--font-base)" }}>
              {days.length === 0 ? (
                <p className="py-12 text-center text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] text-slate-400">아직 작성된 일정이 없습니다.</p>
              ) : (
                <ItineraryView days={days} departDate={voyage.departDate} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 저장/발행 완료 팝업 */}
      {savedPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSavedPopup(null)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            </span>
            <h3 className="mt-4 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">
              {savedPopup === "published" ? "발행되었습니다" : "임시저장되었습니다"}
            </h3>
            <p className="mt-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-500">
              {savedPopup === "published" ? (
                "고객 상세페이지 여행일정에 노출됩니다."
              ) : (
                <>
                  초안으로 저장되었습니다.
                  <br />
                  (상세페이지에는 아직 노출되지 않습니다)
                </>
              )}
            </p>
            <button
              onClick={() => setSavedPopup(null)}
              className="mt-6 rounded-lg bg-[#1E4D8B] px-6 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white transition hover:brightness-110"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReuseModal({
  currentId,
  days,
  onLoad,
  onClose,
}: {
  currentId: string;
  days: ItineraryDay[];
  onLoad: (days: ItineraryDay[]) => void;
  onClose: () => void;
}) {
  const { voyages } = useVoyages();
  const others = voyages.filter((v) => v.id !== currentId);
  const withItinerary = others.filter((v) => (v.itineraryDays?.length ?? 0) > 0);
  const [targets, setTargets] = useState<Set<string>>(new Set());
  const [sourceId, setSourceId] = useState("");
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) =>
    setTargets((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const apply = async () => {
    if (targets.size === 0 || days.length === 0) return;
    if (!confirm(`현재 일정을 선택한 ${targets.size}개 상품에 적용(덮어쓰기)할까요?`)) return;
    setBusy(true);
    try {
      const clean = firestoreSafeDays(days);
      await Promise.all([...targets].map((id) => updateVoyage(id, { itineraryDays: clean, itineraryStatus: "published" })));
      alert(`${targets.size}개 상품에 적용했습니다.`);
      onClose();
    } catch (e) {
      alert("적용 실패: " + (e instanceof Error ? e.message : ""));
    } finally {
      setBusy(false);
    }
  };

  const load = () => {
    const src = voyages.find((v) => v.id === sourceId);
    if (!src?.itineraryDays?.length) return;
    if (days.length > 0 && !confirm("현재 작성 중인 일정을 불러온 일정으로 교체할까요?")) return;
    const cloned = src.itineraryDays.map((d) => ({
      ...d,
      id: uid(),
      blocks: d.blocks.map((b) => ({ ...b, id: uid() })),
    }));
    onLoad(cloned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 text-[14px]">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-bold text-slate-800">일정 재사용</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="space-y-6 px-6 py-5">
          {/* 다른 상품에 적용 */}
          <div>
            <p className="text-sm font-bold text-slate-700">이 일정을 다른 상품에 적용</p>
            <p className="mt-0.5 text-xs text-slate-400">선택한 상품들의 일정을 현재 일정으로 덮어씁니다.</p>
            <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-200">
              {others.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">다른 상품이 없습니다.</p>
              ) : (
                others.map((v) => (
                  <label key={v.id} className="flex cursor-pointer items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0 hover:bg-slate-50">
                    <input type="checkbox" checked={targets.has(v.id)} onChange={() => toggle(v.id)} className="accent-[#1E4D8B]" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{v.title}</span>
                    {(v.itineraryDays?.length ?? 0) > 0 && (
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">기존 일정 있음</span>
                    )}
                  </label>
                ))
              )}
            </div>
            <button
              onClick={apply}
              disabled={busy || targets.size === 0 || days.length === 0}
              className="mt-3 w-full rounded-lg bg-[#1E4D8B] py-2.5 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              {busy ? "적용 중…" : `선택한 ${targets.size}개 상품에 적용`}
            </button>
          </div>

          {/* 다른 상품 일정 불러오기 */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-sm font-bold text-slate-700">다른 상품의 일정 불러오기</p>
            <p className="mt-0.5 text-xs text-slate-400">선택한 상품의 일정을 현재 편집기로 복사합니다.</p>
            <div className="mt-3 flex gap-2">
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1E4D8B]"
              >
                <option value="">일정이 있는 상품 선택…</option>
                {withItinerary.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.title} ({v.itineraryDays?.length}일차)
                  </option>
                ))}
              </select>
              <button
                onClick={load}
                disabled={!sourceId}
                className="shrink-0 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                불러오기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockCard({
  block,
  voyageTitle,
  voyageFlight,
  onPatch,
  onRemove,
  onMove,
}: {
  block: ItineraryBlock;
  voyageTitle?: string;
  voyageFlight?: string;
  onPatch: (p: Partial<ItineraryBlock>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const spec = specOf(block.type);
  const belowFields = spec.fields.filter((f) => f.below);
  return (
    <div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0px_1px_2px_-1px_#0000001a,0px_1px_3px_0px_#0000001a]">
      {/* 블록 헤더 */}
      <div className={`flex items-center justify-between ${BLOCK_STYLE.headerPad} ${spec.headerBg}`}>
        <span
          className={`flex items-center gap-[0.5em] text-[min(1.188vw,22.8096px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[2.9957vw] font-semibold ${spec.accent}`}
          style={{ fontFamily: "Inter, var(--font-sans)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {block.type === "tour" ? (
            <span className="grid shrink-0 place-items-center rounded-[8px] p-[0.35em]" style={{ backgroundColor: spec.iconBg }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spec.icon} alt="" className="h-[1.8em] w-[1.8em] object-contain" />
            </span>
          ) : (
            <img src={spec.icon} alt="" className="h-[1.8em] w-[1.8em] object-contain" />
          )}
          {spec.label}
        </span>
        <div className="flex items-center gap-2 text-slate-400">
          <button onClick={() => onMove(-1)} className="hover:text-slate-600" aria-label="위로">▲</button>
          <button onClick={() => onMove(1)} className="hover:text-slate-600" aria-label="아래로">▼</button>
          <button onClick={onRemove} className="text-[min(0.891vw,17.1072px)] max-[991px]:text-[min(2.75vw,16.5px)] max-[501px]:text-[2.7vw] font-semibold text-red-400 hover:text-red-500">삭제</button>
        </div>
      </div>

      {/* 블록 본문 */}
      <div className="grid grid-cols-2 gap-x-[1.5em] gap-y-[1em] p-[1.2em] max-[501px]:grid-cols-1">
        {block.type === "flight" ? (
          <FlightEdit block={block} onPatch={onPatch} voyageFlight={voyageFlight} />
        ) : block.type === "tour" ? (
          <TourSelect block={block} onPatch={onPatch} voyageTitle={voyageTitle} />
        ) : block.type === "meal" ? (
          <MealEdit block={block} onPatch={onPatch} />
        ) : (
        <>
        {spec.image && (
          <div className="col-span-2">
            <p className="mb-[0.4em] text-[min(1.188vw,22.8096px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[2.9957vw] font-medium text-[#99A1AF]">이미지 (여러 장 가능)</p>
            <ImageUploader
              dir="itinerary"
              multiple
              value={block.urls ?? (block.url ? [block.url] : [])}
              onChange={(v) => onPatch({ urls: v, url: undefined })}
            />
          </div>
        )}
        {spec.fields.filter((f) => !f.below && !f.isImage).map((f) => (
          <div key={String(f.key)} className={f.full ? "col-span-2" : ""}>
            <p className="mb-[0.4em] text-[min(1.188vw,22.8096px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[2.9957vw] font-medium text-[#99A1AF]">{f.label}</p>
            {f.options ? (
              <div className="relative">
                {f.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.icon}
                    alt=""
                    className="pointer-events-none absolute left-3 top-1/2 h-[1.2em] w-[1.2em] -translate-y-1/2 object-contain"
                  />
                )}
                <select
                  value={(block[f.key] as string) ?? ""}
                  onChange={(e) => onPatch({ [f.key]: e.target.value })}
                  className={`w-full rounded-[10px] bg-[#F9FAFB] py-2 text-[min(1.2128vw,23.2866px)] max-[991px]:text-[min(3.1478vw,18.8865px)] max-[501px]:text-[3.0582vw] font-medium text-[#364153] outline-none transition focus:bg-white ${
                    f.icon ? "pl-10 pr-3" : "px-3"
                  }`}
                  style={{ fontFamily: "Inter, var(--font-sans)", ...f.valueStyle }}
                >
                  <option value="">선택</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            ) : isRichField(f) ? (
              <RichText
                value={(block[f.key] as string) ?? ""}
                onChange={(v) => onPatch({ [f.key]: v })}
                multiline={f.area}
              />
            ) : f.color ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={(block[f.key] as string) || "#1E4D8B"}
                  onChange={(e) => onPatch({ [f.key]: e.target.value })}
                  className="h-9 w-14 cursor-pointer rounded-[8px] border border-slate-200 bg-white p-1"
                />
                <span className="text-[min(1.1261vw,21.6207px)] max-[991px]:text-[min(2.9229vw,17.5374px)] max-[501px]:text-[2.8398vw] text-slate-500">{(block[f.key] as string) || "기본"}</span>
                {block[f.key] && (
                  <button type="button" onClick={() => onPatch({ [f.key]: "" })} className="text-[min(1.1261vw,21.6207px)] max-[991px]:text-[min(2.9229vw,17.5374px)] max-[501px]:text-[2.8398vw] text-slate-400 underline">
                    초기화
                  </button>
                )}
              </div>
            ) : f.time ? (
              <TimeSelect value={(block[f.key] as string) ?? ""} onChange={(v) => onPatch({ [f.key]: v })} />
            ) : (
              <div className="relative">
                {f.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.icon}
                    alt=""
                    className="pointer-events-none absolute left-3 top-1/2 h-[1.2em] w-[1.2em] -translate-y-1/2 object-contain"
                  />
                )}
                <input
                  type={f.date ? "date" : undefined}
                  value={(block[f.key] as string) ?? ""}
                  onChange={(e) => onPatch({ [f.key]: e.target.value })}
                  placeholder={`${f.label} 입력`}
                  className={`w-full rounded-[10px] bg-[#F9FAFB] py-2 text-[min(1.2128vw,23.2866px)] max-[991px]:text-[min(3.1478vw,18.8865px)] max-[501px]:text-[3.0582vw] font-medium text-[#364153] outline-none transition focus:bg-white ${
                    f.icon ? "pl-10 pr-3" : "px-3"
                  }`}
                  style={{ fontFamily: "Inter, var(--font-sans)" }}
                />
              </div>
            )}
          </div>
        ))}
        </>
        )}
      </div>
    </div>
    {belowFields.map((f) => (
      <div key={String(f.key)} className="relative mt-3">
        {/* 점 아래로 이어지는 세로 점선 (점에 맞춤) */}
        <span className="pointer-events-none absolute bottom-0 left-[-1.4em] top-0 w-[2px]" style={BLOCK_STYLE.descRule} />
        {isRichField(f) ? (
          <div className="py-[0.6em] pl-[1.2em] pr-[1.2em]">
            <RichText value={(block[f.key] as string) ?? ""} onChange={(v) => onPatch({ [f.key]: v })} multiline />
          </div>
        ) : (
          <textarea
            value={(block[f.key] as string) ?? ""}
            onChange={(e) => onPatch({ [f.key]: e.target.value })}
            rows={2}
            placeholder={`${f.label}을 입력하세요`}
            className="w-full resize-none bg-transparent py-[1.1em] pl-[1.2em] pr-[1.2em] text-[min(1.386vw,26.6112px)] max-[991px]:text-[min(3.5974vw,21.5847px)] max-[501px]:text-[3.4951vw] leading-[1.8] text-[#6A7282] outline-none [field-sizing:content] placeholder:text-slate-300"
          />
        )}
      </div>
    ))}
    </div>
  );
}

// 식사 블록 편집 — 하루 1개, 조식/중식/석식 내용 입력 (비우면 '미포함')
const FLIGHT_INP = "w-full rounded-[8px] bg-[#F9FAFB] px-2.5 py-1.5 text-[1.19em] max-[501px]:text-[2.6vw] font-medium text-[#364153] outline-none transition focus:bg-white";
/** 소요시간 입력 — 시간/분 두 칸. 시차가 있는 국제선은 도착-출발 자동계산이 틀리므로 여기에 실제 값 입력 */
function DurationInput({ value, onChange }: { value?: number; onChange: (v: number | undefined) => void }) {
  const h = value != null ? Math.floor(value / 60) : "";
  const m = value != null ? value % 60 : "";
  const set = (nh: number | "", nm: number | "") => {
    if (nh === "" && nm === "") return onChange(undefined);
    onChange((Number(nh) || 0) * 60 + (Number(nm) || 0));
  };
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <input type="number" min={0} inputMode="numeric" className={FLIGHT_INP + " !w-12 shrink-0 px-1.5 text-center"} value={h}
        onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value), m)} placeholder="0" />
      <span className="shrink-0 text-[1.19em] max-[501px]:text-[2.4vw] text-slate-400">시간</span>
      <input type="number" min={0} max={59} inputMode="numeric" className={FLIGHT_INP + " !w-12 shrink-0 px-1.5 text-center"} value={m}
        onChange={(e) => set(h, e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
      <span className="shrink-0 text-[1.19em] max-[501px]:text-[2.4vw] text-slate-400">분</span>
    </div>
  );
}
function FField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <p className="mb-[0.3em] text-[min(0.9979vw,19.1601px)] max-[991px]:text-[min(2.5902vw,15.5412px)] max-[501px]:text-[2.5166vw] font-medium text-[#99A1AF]">{label}</p>
      {children}
    </div>
  );
}
/** 경유 포함 항공 편집 — 구간(FlightSegment) 목록 */
function FlightEdit({ block, onPatch, voyageFlight }: { block: ItineraryBlock; onPatch: (p: Partial<ItineraryBlock>) => void; voyageFlight?: string }) {
  const segs: FlightSegment[] = block.segments ?? [];
  const setSeg = (i: number, patch: Partial<FlightSegment>) =>
    onPatch({ segments: segs.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const addSeg = () => onPatch({ segments: [...segs, { airline: voyageFlight || undefined }] });
  const removeSeg = (i: number) => onPatch({ segments: segs.filter((_, idx) => idx !== i) });
  return (
    <div className="col-span-2">
      <p className="mb-2 text-[min(1.188vw,22.8096px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[2.9957vw] font-medium text-[#99A1AF]">항공 구간 (경유 시 구간을 여러 개 추가)</p>
      <div className="flex flex-col gap-3">
        {segs.map((s, i) => (
          <div key={i} className="rounded-[10px] border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[min(1.0811vw,20.7567px)] max-[991px]:text-[min(2.806vw,16.8363px)] max-[501px]:text-[2.7262vw] font-bold text-[#2563EB]">{i + 1}구간</span>
              {segs.length > 1 && (
                <button type="button" onClick={() => removeSeg(i)} className="text-[min(1.0811vw,20.7567px)] max-[991px]:text-[min(2.806vw,16.8363px)] max-[501px]:text-[2.7262vw] font-semibold text-red-400 hover:text-red-500">구간 삭제</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FField label="항공사 / 편명" full>
                <input className={FLIGHT_INP} value={s.airline ?? ""} onChange={(e) => setSeg(i, { airline: e.target.value })} placeholder="에미레이트 EK323" />
              </FField>
              <FField label="출발지">
                <input className={FLIGHT_INP} value={s.from ?? ""} onChange={(e) => setSeg(i, { from: e.target.value })} placeholder="ICN 인천" />
              </FField>
              <FField label="도착지">
                <input className={FLIGHT_INP} value={s.to ?? ""} onChange={(e) => setSeg(i, { to: e.target.value })} placeholder="DXB 두바이" />
              </FField>
              <FField label="출발일">
                <input type="date" className={FLIGHT_INP} value={s.dateDepart ?? ""} onChange={(e) => setSeg(i, { dateDepart: e.target.value })} />
              </FField>
              <FField label="출발시간">
                <TimeSelect value={s.timeDepart} onChange={(v) => setSeg(i, { timeDepart: v })} />
              </FField>
              <FField label="도착일">
                <input type="date" className={FLIGHT_INP} value={s.dateArrive ?? ""} onChange={(e) => setSeg(i, { dateArrive: e.target.value })} />
              </FField>
              <FField label="도착시간">
                <TimeSelect value={s.timeArrive} onChange={(v) => setSeg(i, { timeArrive: v })} />
              </FField>
              <FField label="소요시간 (시차 반영)" full>
                <DurationInput value={s.durationMin} onChange={(v) => setSeg(i, { durationMin: v })} />
              </FField>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={addSeg} className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-[min(1.1088vw,21.289px)] max-[991px]:text-[min(2.8779vw,17.2674px)] max-[501px]:text-[2.7961vw] font-semibold text-[#2563EB] transition hover:bg-slate-50">
        + 경유 구간 추가
      </button>
    </div>
  );
}

function MealEdit({ block, onPatch }: { block: ItineraryBlock; onPatch: (p: Partial<ItineraryBlock>) => void }) {
  const rows: [string, "breakfast" | "lunch" | "dinner"][] = [
    ["조식", "breakfast"],
    ["중식", "lunch"],
    ["석식", "dinner"],
  ];
  return (
    <div className="col-span-2 flex flex-col gap-2">
      {rows.map(([label, key]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-[3em] shrink-0 rounded bg-navy/5 py-1.5 text-center text-[min(1.0727vw,20.5932px)] max-[991px]:text-[min(2.4402vw,14.6411px)] max-[501px]:text-[2.8224vw] font-bold text-navy">{label}</span>
          <input
            value={(block[key] as string) ?? ""}
            onChange={(e) => onPatch({ [key]: e.target.value })}
            placeholder="내용 입력 (예: 선상식 · 비우면 미포함)"
            className="w-full rounded-[10px] bg-[#F9FAFB] px-3 py-2 text-[min(1.2619vw,24.2273px)] max-[991px]:text-[min(2.8708vw,17.2247px)] max-[501px]:text-[3.3204vw] font-medium text-[#364153] outline-none transition focus:bg-white"
            style={{ fontFamily: "Inter, var(--font-sans)" }}
          />
        </div>
      ))}
    </div>
  );
}

function TourSelect({ block, onPatch, voyageTitle }: { block: ItineraryBlock; onPatch: (p: Partial<ItineraryBlock>) => void; voyageTitle?: string }) {
  const { ports } = usePorts();
  const pick = (id: string) => {
    const card = ports.find((p) => p.id === id);
    if (!card) {
      onPatch({ tourCardId: "", tourKind: "기항지", tourName: "", tourCountry: "", tourDesc: "", tourImage: "" });
      return;
    }
    onPatch({
      tourCardId: card.id,
      tourKind: card.kind ?? "기항지",
      tourName: card.name,
      tourCountry: card.country,
      tourDesc: card.description,
      tourImage: card.imageUrl ?? "",
    });
  };

  // 지역별 + 기항지/관광지로 묶어서 표시 (기항지 → 관광지 순)
  const kindOrder: Record<string, number> = { 기항지: 0, 관광지: 1 };
  const grouped = (() => {
    const m = new Map<string, { region: string; kind: string; cards: typeof ports }>();
    for (const p of ports) {
      const region = p.region || "기타";
      const kind = p.kind ?? "기항지";
      const key = `${region}|${kind}`;
      if (!m.has(key)) m.set(key, { region, kind, cards: [] });
      m.get(key)!.cards.push(p);
    }
    // 상품명(항차 제목)에 포함된 권역을 최상단으로 (복합 권역은 조각별 매칭: "미주·알래스카" → "알래스카"만 있어도 OK)
    const inTitle = (region: string) =>
      !!voyageTitle &&
      !!region &&
      region
        .split(/[·,/]/)
        .map((s) => s.trim())
        .some((part) => part && voyageTitle.includes(part));
    return [...m.values()].sort(
      (a, b) =>
        (inTitle(a.region) ? 0 : 1) - (inTitle(b.region) ? 0 : 1) ||
        a.region.localeCompare(b.region, "ko") ||
        (kindOrder[a.kind] ?? 9) - (kindOrder[b.kind] ?? 9),
    );
  })();

  return (
    <div className="col-span-2">
      <p className="mb-[0.4em] text-[min(1.188vw,22.8096px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[2.9957vw] font-medium text-[#99A1AF]">관광정보</p>
      <select
        value={block.tourCardId ?? ""}
        onChange={(e) => pick(e.target.value)}
        className="w-full rounded-[10px] bg-[#F9FAFB] px-3 py-2 text-[min(1.2128vw,23.2866px)] max-[991px]:text-[min(3.1478vw,18.8865px)] max-[501px]:text-[3.0582vw] font-medium text-[#364153] outline-none transition focus:bg-white"
      >
        <option value="">카드를 선택하세요…</option>
        {grouped.map((g) => (
          <optgroup key={`${g.region}|${g.kind}`} label={`${g.region} · ${g.kind}`}>
            {g.cards.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.country}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {block.tourName && (
        <>
          <div className="mt-3 flex gap-3 rounded-[10px] border border-slate-200 bg-white p-3">
            {block.tourImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.tourImage} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
            )}
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[min(1.386vw,26.6112px)] max-[991px]:text-[min(3.5974vw,21.5847px)] max-[501px]:text-[3.4951vw] font-bold text-[#0B2A4A]">
                {block.tourName} <span className="font-normal text-slate-400">{block.tourCountry}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[1.05em] font-semibold text-slate-500">{block.tourKind ?? "기항지"}</span>
              </p>
              <p className="mt-1 line-clamp-2 text-[min(1.2128vw,23.2866px)] max-[991px]:text-[min(3.1478vw,18.8865px)] max-[501px]:text-[3.0582vw] text-slate-500">{block.tourDesc}</p>
            </div>
          </div>
          <p className="mt-1.5 text-[min(1.188vw,22.8096px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[2.9957vw] text-slate-400">
            {(block.tourKind ?? "기항지") === "기항지"
              ? "일정표에 기항지 안내 카드(이미지+설명)로 표시됩니다."
              : "일정표에 카드 없이 텍스트(이름 · 설명)로 표시됩니다."}
          </p>
        </>
      )}
      {ports.length === 0 && (
        <p className="mt-2 text-[min(1.188vw,22.8096px)] max-[991px]:text-[min(3.0834vw,18.5004px)] max-[501px]:text-[2.9957vw] text-slate-400">
          등록된 관광정보 카드가 없습니다.{" "}
          <Link href="/admin/ports" className="font-semibold text-[#1E4D8B] hover:underline">
            카드 관리
          </Link>
          에서 먼저 등록하세요.
        </p>
      )}
    </div>
  );
}
