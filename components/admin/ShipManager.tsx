"use client";

import { useState } from "react";
import type { ShipCard } from "@/lib/types";
import { useShips } from "@/lib/useShips";
import { useVoyages } from "@/lib/useVoyages";
import { addShip, updateShip, deleteShip, seedShips, type ShipInput } from "@/lib/ships";
import ImageUploader from "@/components/ImageUploader";

const empty: ShipInput = { name: "", line: "", description: "", usedByCount: 0 };


export default function ShipManager() {
  const { ships, loading } = useShips();
  const { voyages } = useVoyages();
  const [editing, setEditing] = useState<ShipCard | null | undefined>(undefined);
  // 사용 상품수는 저장값이 아니라 실제 운항 일정에서 자동 계산
  const usedCount = (name: string) => voyages.filter((v) => v.shipName === name).length;

  // 기존 등록된 선사 목록 (선박 카드 + 운항일정에서 수집, 중복 제거·가나다순)
  const lineOptions = Array.from(
    new Set([...ships.map((s) => s.line), ...voyages.map((v) => v.line)].filter(Boolean) as string[]),
  ).sort((a, b) => a.localeCompare(b, "ko"));

  // 선사별 그룹(이름순)
  const lineGroups = Array.from(
    ships.reduce((m, s) => {
      (m.get(s.line) ?? m.set(s.line, []).get(s.line)!).push(s);
      return m;
    }, new Map<string, ShipCard[]>()),
  )
    .map(([line, cards]) => ({
      line,
      items: [...cards].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    }))
    .sort((a, b) => a.line.localeCompare(b.line, "ko"));

  const remove = async (s: ShipCard) => {
    if (confirm(`"${s.name}" 선박 카드를 삭제할까요?`)) await deleteShip(s.id);
  };
  const seed = async () => {
    const n = await seedShips();
    alert(n > 0 ? `샘플 ${n}건을 불러왔습니다.` : "이미 데이터가 있습니다.");
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 max-[501px]:flex-col max-[501px]:gap-3">
        <div>
          <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">선박 카드 관리</h1>
          <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">재사용 가능한 선박 정보 카드를 관리합니다</p>
        </div>
        <div className="flex shrink-0 gap-2 max-[501px]:self-end">
          {!loading && ships.length === 0 && (
            <button onClick={seed} className="rounded-lg border border-slate-300 px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">샘플 불러오기</button>
          )}
          <button onClick={() => setEditing(null)} className="rounded-lg bg-navy px-4 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark">+ 카드 생성</button>
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : ships.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          등록된 선박 카드가 없습니다. <b>샘플 불러오기</b> 또는 <b>카드 생성</b>으로 시작하세요.
        </div>
      ) : (
        lineGroups.map(({ line, items }) => (
          <section key={line}>
            <h2 className="mb-3 mt-8 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-700 first:mt-0">
              {line || "선사 미지정"} <span className="text-[1em] font-normal text-slate-400">{items.length}개</span>
            </h2>
            <div className="grid grid-cols-3 gap-5 max-[991px]:grid-cols-2 max-[501px]:grid-cols-1">
                  {items.map((s) => (
                    <div key={s.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="relative h-36 w-full overflow-hidden">
                        {(s.productImages?.[0] ?? s.imageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.productImages?.[0] ?? s.imageUrl} alt={s.name} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 to-navy text-[min(2.475vw,47.52px)] max-[991px]:text-[min(7.7089vw,46.2534px)] max-[501px]:text-[9.362vw]">⛴</div>
                        )}
                        <span className="absolute right-3 top-3 rounded-md bg-black/55 px-2.5 py-1 text-[min(0.605vw,11.616px)] max-[991px]:text-[min(1.8843vw,11.3058px)] max-[501px]:text-[2.2884vw] font-semibold text-white backdrop-blur">
                          {usedCount(s.name)}개 상품에 사용 중
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <p className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">{s.name}</p>
                        <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-gold">{s.line}{s.capacity ? ` · 정원 ${s.capacity.toLocaleString()}명` : ""}</p>
                        <p className="mt-2 line-clamp-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-500">{s.description}</p>
                        <div className="mt-auto flex gap-2 pt-4">
                          <button onClick={() => setEditing(s)} className="flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-300 py-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50">✎ 수정</button>
                          <button onClick={() => remove(s)} className="rounded-md border border-red-200 px-3 py-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-red-500 hover:bg-red-50">🗑</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          </section>
        ))
      )}

      {editing !== undefined && <ShipForm initial={editing ?? undefined} lines={lineOptions} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function ShipForm({ initial, lines, onClose }: { initial?: ShipCard; lines: string[]; onClose: () => void }) {
  const [f, setF] = useState<ShipInput>(
    initial
      ? { name: initial.name, line: initial.line, capacity: initial.capacity, description: initial.description, imageUrl: initial.imageUrl, productImages: initial.productImages, features: initial.features, usedByCount: initial.usedByCount }
      : empty,
  );
  const [featuresRaw, setFeaturesRaw] = useState((initial?.features ?? []).join("\n"));
  const [saving, setSaving] = useState(false);
  // 목록에 없는 선사(신규)면 직접 입력 모드로 시작
  const [customLine, setCustomLine] = useState(!!initial?.line && !lines.includes(initial.line));
  const set = (k: keyof ShipInput, v: unknown) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: ShipInput = { ...f, features: featuresRaw.split("\n").map((s) => s.trim()).filter(Boolean) };
      if (initial) await updateShip(initial.id, payload);
      else await addShip(payload);
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
          <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">{initial ? "선박 카드 수정" : "선박 카드 생성"}</h2>
          <button type="button" onClick={onClose} className="shrink-0 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 transition hover:text-slate-600" aria-label="닫기">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="선박명"><input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} required /></Field>
          <Field label="선사">
            {customLine ? (
              <div className="flex gap-1.5">
                <input className={inp} value={f.line} onChange={(e) => set("line", e.target.value)} placeholder="새 선사명 입력" autoFocus />
                <button
                  type="button"
                  onClick={() => { setCustomLine(false); set("line", ""); }}
                  className="shrink-0 rounded-lg border border-slate-300 px-2.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500 hover:bg-slate-50"
                >
                  목록
                </button>
              </div>
            ) : (
              <select
                className={inp}
                value={f.line}
                onChange={(e) => {
                  if (e.target.value === "__new__") { setCustomLine(true); set("line", ""); }
                  else set("line", e.target.value);
                }}
              >
                <option value="">선택</option>
                {lines.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
                <option value="__new__">+ 새 선사 직접 입력</option>
              </select>
            )}
          </Field>
          <Field label="정원"><input type="number" className={inp} value={f.capacity ?? ""} onChange={(e) => set("capacity", e.target.value === "" ? undefined : +e.target.value)} /></Field>
          <Field label="상품 설명 (상세 '상품정보' 탭 노출)" full><textarea className={inp} rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <Field label="이미지 (여러 장 · 첫 장은 상세 '상품정보' 탭 맨 위 큰 사진, 나머지는 그 아래 갤러리)" full>
            <ImageUploader
              multiple
              value={f.productImages ?? []}
              onChange={(v) => set("productImages", v)}
              dir="products"
              label="이미지를 끌어다 놓거나 클릭하여 업로드 (여러 장 가능)"
            />
          </Field>
          <Field label="상품 특징 (한 줄에 하나 · 상세 '상품정보' 탭)" full>
            <textarea className={inp} rows={3} value={featuresRaw} onChange={(e) => setFeaturesRaw(e.target.value)} placeholder={"전 일정 전문 인솔자 동행\n크루즈 선실료 포함"} />
          </Field>
        </div>
        <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">취소</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-navy px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark disabled:opacity-50">{saving ? "저장 중…" : "저장"}</button>
        </div>
      </form>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-[1.25em] outline-none focus:border-brand";
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
