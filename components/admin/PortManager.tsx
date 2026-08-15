"use client";

import { useState } from "react";
import type { PortCard, PortKind, Voyage } from "@/lib/types";
import { usePorts } from "@/lib/usePorts";
import { useVoyages } from "@/lib/useVoyages";
import { addPort, updatePort, deletePort, seedPorts, type PortInput } from "@/lib/ports";
import { groupVoyages, groupKey } from "@/lib/voyage-group";
import { ASIA_REGIONS } from "@/lib/region-filter";
import ImageUploader from "@/components/ImageUploader";
import Pagination from "@/components/admin/Pagination";

/** 카드 수정 모달 글자 크기 — 관리자 화면은 폭이 고정이라 vw 가 아니라 px 로 잡는다.
 *  본문(라벨·입력칸·버튼·목록)은 전부 MODAL_TEXT 하나로 통일. */
const MODAL_TEXT = "text-[14px]";
const MODAL_SUB = "text-[12px]"; // 목록 부제 등 보조 문구
const MODAL_TITLE = "text-[18px]";

/** voyageIds 가 걸쳐 있는 크루즈 상품(그룹) 수 — 카드 "N개 상품에 사용 중" 집계용 */
function productCount(voyages: Voyage[], voyageIds?: string[]): number {
  if (!voyageIds?.length) return 0;
  const keys = new Set<string>();
  for (const v of voyages) if (voyageIds.includes(v.id)) keys.add(groupKey(v));
  return keys.size;
}

const regionGradient: Record<string, string> = {
  유럽: "from-sky-400 to-indigo-700",
  중동: "from-amber-400 to-orange-700",
  "미주·알래스카": "from-cyan-300 to-sky-600",
  동남아: "from-emerald-300 to-teal-600",
  동북아: "from-blue-300 to-slate-600",
};

const PORT_KINDS: PortKind[] = ["기항지", "관광지"];
const kindOf = (p: PortCard): PortKind => p.kind ?? "기항지";
// 세부 권역 순서 (탭/섹션 정렬 + 폼 선택지 공용). 목록에 없는 권역은 뒤로.
const PORT_REGION_ORDER = ["서부지중해", "동부지중해", "북유럽", "미주·알래스카", "중동", "동남아", "동북아"];
// 표시 전용 라벨 (데이터 값은 그대로, 화면 표기만 변경)
const regionLabel = (r: string) => (ASIA_REGIONS.includes(r) ? "동남아/동북아" : r);
// 동남아·동북아는 한 묶음으로 취급 (한쪽만 골라도 둘 다 표시)
const sameRegionGroup = (a: string, b: string) =>
  a === b || (ASIA_REGIONS.includes(a) && ASIA_REGIONS.includes(b));
const regionRank = (r: string) => {
  const i = PORT_REGION_ORDER.indexOf(r);
  return i === -1 ? 999 : i;
};

const empty: PortInput = {
  name: "",
  kind: "기항지",
  region: "",
  country: "",
  description: "",
  usedByCount: 0,
  voyageIds: [],
};

export default function PortManager() {
  const { ports, loading } = usePorts();
  const { voyages } = useVoyages();
  const [editing, setEditing] = useState<PortCard | null | undefined>(undefined); // undefined=닫힘, null=신규
  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  const [kind, setKind] = useState<PortKind>("기항지"); // 기항지 / 관광지 탭
  const [region, setRegion] = useState("전체"); // 권역 필터

  const kindCount = (k: PortKind) => ports.filter((p) => kindOf(p) === k).length;
  // 현재 탭(기항지/관광지)에 해당하는 카드만 대상으로 그룹핑
  const kindPorts = ports.filter((p) => kindOf(p) === kind);

  // 권역별 그룹: 각 권역 카드는 (order → name) 순으로, 권역 자체는 이름순으로 정렬
  const groups = Array.from(
    kindPorts.reduce((m, p) => {
      (m.get(p.region) ?? m.set(p.region, []).get(p.region)!).push(p);
      return m;
    }, new Map<string, PortCard[]>()),
  )
    .map(([region, cards]) => ({
      region,
      cards: [...cards].sort(
        (a, b) =>
          (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
          a.name.localeCompare(b.name, "ko"),
      ),
    }))
    .sort((a, b) => regionRank(a.region) - regionRank(b.region) || a.region.localeCompare(b.region, "ko"));

  // 권역 칩 — 동남아·동북아는 하나로 합쳐 개수도 합산해 표시
  const regionChips = groups.reduce<{ region: string; count: number }[]>((acc, g) => {
    const merged = ASIA_REGIONS.includes(g.region)
      ? acc.find((c) => ASIA_REGIONS.includes(c.region))
      : undefined;
    if (merged) merged.count += g.cards.length;
    else acc.push({ region: g.region, count: g.cards.length });
    return acc;
  }, []);

  // 지역순으로 평탄화 후 12개/페이지로 페이징 (카드마다 소속 지역·지역 내 인덱스 유지 → 순서이동에 사용)
  const flat = groups.flatMap((g) =>
    g.cards.map((card, idx) => ({ region: g.region, card, regionCards: g.cards, idx })),
  );
  // 선택한 권역만 필터 (없어진 권역이 선택돼 있으면 전체로 간주)
  const activeRegion = region !== "전체" && groups.some((g) => sameRegionGroup(g.region, region)) ? region : "전체";
  const filtered =
    activeRegion === "전체" ? flat : flat.filter((it) => sameRegionGroup(it.region, activeRegion));
  const pagedItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // 현재 페이지 카드들을 지역별로 다시 묶어 섹션 렌더 (지역 구분 유지)
  const pageGroups: { region: string; items: typeof pagedItems }[] = [];
  for (const it of pagedItems) {
    let g = pageGroups[pageGroups.length - 1];
    if (!g || g.region !== it.region) {
      g = { region: it.region, items: [] };
      pageGroups.push(g);
    }
    g.items.push(it);
  }

  const remove = async (p: PortCard) => {
    if (confirm(`"${p.name}" 카드를 삭제할까요?`)) await deletePort(p.id);
  };
  const seed = async () => {
    const n = await seedPorts();
    alert(n > 0 ? `샘플 ${n}건을 불러왔습니다.` : "이미 데이터가 있습니다.");
  };

  // 같은 권역 내에서 카드 순서 이동: 위치를 바꾼 뒤 0..n 으로 정규화하여 저장(중복/누락 order 자동 보정)
  const move = async (cards: PortCard[], index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= cards.length) return;
    const arr = [...cards];
    [arr[index], arr[target]] = [arr[target], arr[index]];
    await Promise.all(
      arr.flatMap((c, i) => (c.order === i ? [] : [updatePort(c.id, { order: i })])),
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 max-[501px]:flex-col max-[501px]:gap-3">
        <div>
          <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">관광정보 카드 관리</h1>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">재사용 가능한 관광정보 카드를 관리합니다</p>
        </div>
        <div className="flex shrink-0 gap-2 max-[501px]:self-end">
          {!loading && ports.length === 0 && (
            <button onClick={seed} className="rounded-lg border border-slate-300 px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">
              샘플 불러오기
            </button>
          )}
          <button onClick={() => setEditing(null)} className="rounded-lg bg-navy px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark">
            + 카드 생성
          </button>
        </div>
      </div>

      {/* 기항지 / 관광지 탭 */}
      {!loading && ports.length > 0 && (
        <div className="mb-4 flex gap-2 border-b border-slate-200">
          {PORT_KINDS.map((k) => (
            <button
              key={k}
              onClick={() => { setKind(k); setRegion("전체"); setPage(1); }}
              className={`-mb-px border-b-2 px-4 py-2.5 text-[min(1.045vw,20.064px)] max-[991px]:text-[min(3.2547vw,19.5282px)] max-[501px]:text-[3.9527vw] font-bold transition ${
                kind === k ? "border-navy text-navy" : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {k} <span className="text-[0.85em] font-semibold opacity-60">{kindCount(k)}</span>
            </button>
          ))}
        </div>
      )}

      {/* 권역 필터 — 원하는 권역만 골라 보면 화면이 짧아집니다 */}
      {!loading && kindPorts.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {[{ region: "전체", count: kindPorts.length }, ...regionChips].map((c) => (
            <button
              key={c.region}
              onClick={() => { setRegion(c.region); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-semibold transition ${
                sameRegionGroup(activeRegion, c.region) ? "bg-navy text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {regionLabel(c.region)} <span className="opacity-70">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : ports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          등록된 관광정보 카드가 없습니다. <b>샘플 불러오기</b> 또는 <b>카드 생성</b>으로 시작하세요.
        </div>
      ) : kindPorts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          {kind} 카드가 없습니다. 우측 상단 <b>+ 카드 생성</b>으로 추가하세요.
        </div>
      ) : (
        pageGroups.map(({ region, items }) => (
          <section key={region}>
            <h2 className="mb-3 mt-8 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-700 first:mt-0">
              {regionLabel(region)} <span className="text-[1em] font-normal text-slate-400">{items[0].regionCards.length}개</span>
            </h2>
            <div className="grid grid-cols-3 gap-5 max-[991px]:grid-cols-2 max-[501px]:grid-cols-1">
              {items.map(({ card: p, regionCards, idx }) => (
                <div key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="relative h-36 w-full overflow-hidden">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${regionGradient[p.region] ?? "from-sky-400 to-blue-700"}`} />
                    )}
                    <span className="absolute right-3 top-3 rounded-md bg-black/55 px-2.5 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-semibold text-white backdrop-blur">
                      {productCount(voyages, p.voyageIds)}개 상품에 사용 중
                    </span>
                    <div className="absolute left-3 top-3 flex gap-1">
                      <button
                        onClick={() => move(regionCards, idx, -1)}
                        disabled={idx === 0}
                        title="앞으로"
                        className="rounded-md bg-black/55 px-2 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-semibold text-white backdrop-blur hover:bg-black/75 disabled:opacity-30"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => move(regionCards, idx, 1)}
                        disabled={idx === regionCards.length - 1}
                        title="뒤로"
                        className="rounded-md bg-black/55 px-2 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-semibold text-white backdrop-blur hover:bg-black/75 disabled:opacity-30"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="flex items-center gap-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-normal text-[#C9A961]">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {p.region}
                    </p>
                    <p className="mt-1 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">{p.name}</p>
                    <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{p.country}</p>
                    <p className="mt-2 line-clamp-2 min-h-[2.9em] text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-500">{p.description}</p>
                    <div className="mt-auto flex gap-2 pt-4">
                      <button onClick={() => setEditing(p)} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 py-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50">
                        ✎ 수정
                      </button>
                      <button onClick={() => remove(p)} className="rounded-md border border-red-200 px-3 py-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-red-500 hover:bg-red-50">
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <Pagination total={filtered.length} pageSize={PAGE_SIZE} page={page} onPage={setPage} />

      {editing !== undefined && (
        <PortForm initial={editing ?? undefined} defaultKind={kind} voyages={voyages} ports={ports} onClose={() => setEditing(undefined)} />
      )}
    </div>
  );
}

function PortForm({ initial, defaultKind, voyages, ports, onClose }: { initial?: PortCard; defaultKind: PortKind; voyages: Voyage[]; ports: PortCard[]; onClose: () => void }) {
  const [f, setF] = useState<PortInput>(
    initial
      ? {
          name: initial.name,
          kind: initial.kind ?? "기항지",
          region: initial.region,
          country: initial.country,
          description: initial.description,
          imageUrl: initial.imageUrl,
          usedByCount: initial.usedByCount,
          voyageIds: initial.voyageIds ?? [],
        }
      : { ...empty, kind: defaultKind },
  );
  const [saving, setSaving] = useState(false);
  const set = (k: keyof PortInput, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  // 관광정보 노출 대상은 여기서 선택한 크루즈 상품(그룹)뿐. 같은 크루즈의 모든 출발일이 통째로 적용된다.
  const selected = f.voyageIds ?? [];
  const groups = groupVoyages(voyages); // [{ rep, members }] — 공개 목록과 동일 그룹핑
  const groupOn = (members: Voyage[]) => members.some((m) => selected.includes(m.id));
  const toggleGroup = (members: Voyage[]) => {
    const ids = members.map((m) => m.id);
    const on = ids.every((id) => selected.includes(id));
    set(
      "voyageIds",
      on ? selected.filter((x) => !ids.includes(x)) : Array.from(new Set([...selected, ...ids])),
    );
  };
  const selectedGroupCount = groups.filter((g) => groupOn(g.members)).length;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...f, usedByCount: selectedGroupCount };
      if (initial) {
        await updatePort(initial.id, payload);
      } else {
        // 신규 카드는 같은 구분·권역의 맨 뒤로 (최대 order + 1)
        const maxOrder = ports
          .filter((p) => (p.kind ?? "기항지") === (f.kind ?? "기항지") && p.region === f.region)
          .reduce((m, p) => Math.max(m, p.order ?? -1), -1);
        await addPort({ ...payload, order: maxOrder + 1 });
      }
      onClose();
    } catch (err) {
      alert("저장 실패: " + (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={save} className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white px-6 pt-6 pb-0 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className={`${MODAL_TITLE} font-bold text-slate-800`}>{initial ? "관광정보 카드 수정" : "관광정보 카드 생성"}</h2>
          <button type="button" onClick={onClose} className={`shrink-0 ${MODAL_TITLE} text-slate-400 transition hover:text-slate-600`} aria-label="닫기">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="구분" full>
            <div className="flex gap-2">
              {PORT_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set("kind", k)}
                  className={`flex-1 rounded-lg border px-3 py-2 ${MODAL_TEXT} font-semibold transition ${
                    (f.kind ?? "기항지") === k
                      ? "border-navy bg-navy text-white"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </Field>
          <Field label="이름"><input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} required /></Field>
          <Field label="권역 (세부)">
            <select className={inp} value={f.region} onChange={(e) => set("region", e.target.value)}>
              <option value="">권역 선택</option>
              {f.region && !PORT_REGION_ORDER.includes(f.region) && (
                <option value={f.region}>{f.region} (기존값)</option>
              )}
              {PORT_REGION_ORDER.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="국가"><input className={inp} value={f.country} onChange={(e) => set("country", e.target.value)} /></Field>
          <Field label={`적용 크루즈 상품 (${selectedGroupCount}개 선택) — 관광정보에 노출`} full>
            {groups.length === 0 ? (
              <p className={`rounded-lg bg-slate-50 px-3 py-2 ${MODAL_TEXT} text-slate-400`}>등록된 크루즈 상품이 없습니다.</p>
            ) : (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                {groups.map(({ rep, members }) => (
                  <label
                    key={rep.id}
                    className={`flex cursor-pointer items-start gap-2 border-b border-slate-100 px-3 py-2 ${MODAL_TEXT} last:border-0 hover:bg-slate-50`}
                  >
                    <input
                      type="checkbox"
                      checked={groupOn(members)}
                      onChange={() => toggleGroup(members)}
                      className="mt-0.5 accent-brand"
                    />
                    <span className="min-w-0">
                      <span className="block text-slate-600">{rep.shipName} · {rep.region} {rep.nights}박 {rep.days}일</span>
                      <span className={`block ${MODAL_SUB} text-slate-400`}>출발일 {members.length}개 (전체 적용)</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </Field>
          <Field label="이미지" full>
            <ImageUploader
              value={f.imageUrl}
              onChange={(v) => set("imageUrl", v)}
              dir="ports"
              label="관광지 이미지를 끌어다 놓거나 클릭하여 업로드"
              textClass={MODAL_TEXT}
            />
          </Field>
          <Field label="설명" full><textarea className={inp} rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
        </div>
        <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className={`rounded-lg border border-slate-300 px-5 py-2.5 ${MODAL_TEXT} font-semibold text-slate-600 hover:bg-slate-50`}>취소</button>
          <button type="submit" disabled={saving} className={`rounded-lg bg-navy px-5 py-2.5 ${MODAL_TEXT} font-semibold text-white hover:bg-navy-dark disabled:opacity-50`}>
            {saving ? "저장 중…" : "저장"}
          </button>
        </div>
      </form>
    </div>
  );
}

// 카드 수정 모달은 고정 px 스케일로 통일한다 — 라벨·입력칸·목록이 모두 14px.
// (vw/em 이 섞여 있어 화면 폭에 따라 10px~25px 로 제각각이던 것을 맞춤)
const inp = `w-full rounded-lg border border-slate-200 px-3 py-2 ${MODAL_TEXT} outline-none focus:border-brand`;

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className={`mb-1 block ${MODAL_TEXT} font-semibold text-slate-500`}>{label}</label>
      {children}
    </div>
  );
}
