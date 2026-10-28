"use client";

import { useState } from "react";
import { usePopups } from "@/lib/usePopups";
import { addPopup, updatePopup, deletePopup, isPopupLive, type Popup, type PopupInput } from "@/lib/popups";
import ImageUploader from "@/components/ImageUploader";

const T_BODY = "text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]";
const T_SMALL = "text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw]";
const INPUT = `w-full rounded-lg border border-slate-200 px-3 py-2 ${T_BODY} outline-none focus:border-brand`;

export default function PopupManager() {
  const { popups, loading } = usePopups();
  const [editing, setEditing] = useState<Popup | null | undefined>(undefined);

  const remove = async (p: Popup) => {
    if (confirm(`"${p.title || "팝업"}"을(를) 삭제할까요?`)) await deletePopup(p.id);
  };
  const toggleActive = (p: Popup) => updatePopup(p.id, { active: !p.active });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 max-[501px]:flex-col max-[501px]:gap-3">
        <div>
          <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">팝업 관리</h1>
          <p className={`mt-1 ${T_BODY} text-slate-400`}>메인 화면 접속 시 뜨는 팝업을 등록합니다. 이미지를 누르면 지정한 링크로 이동합니다.</p>
        </div>
        <button onClick={() => setEditing(null)} className={`shrink-0 rounded-lg bg-navy px-4 py-2 ${T_BODY} font-semibold text-white hover:bg-navy-dark max-[501px]:self-end`}>+ 팝업 등록</button>
      </div>

      {loading ? (
        <p className={`py-16 text-center ${T_BODY} text-slate-400`}>불러오는 중…</p>
      ) : popups.length === 0 ? (
        <div className={`rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center ${T_BODY} text-slate-400`}>
          등록된 팝업이 없습니다. <b>팝업 등록</b>으로 시작하세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {popups.map((p) => {
            const live = isPopupLive(p);
            return (
              <div key={p.id} className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0 max-[501px]:flex-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image ? <img src={p.image} alt="" className="h-16 w-16 shrink-0 rounded-md border border-slate-200 object-cover" /> : <div className="h-16 w-16 shrink-0 rounded-md bg-slate-100" />}
                <div className="min-w-0 flex-1">
                  <p className={`truncate ${T_BODY} font-semibold text-slate-700`}>{p.title || "(제목 없음)"}</p>
                  <p className={`truncate ${T_SMALL} text-slate-400`}>
                    {p.link ? `→ ${p.link}` : "링크 없음"} · {p.startDate || "즉시"} ~ {p.endDate || "계속"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 ${T_SMALL} font-semibold ${live ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                  {live ? "노출 중" : p.active ? "기간 외" : "숨김"}
                </span>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => toggleActive(p)} className={`rounded-md border border-slate-300 px-3 py-1.5 ${T_SMALL} font-semibold text-slate-600 hover:bg-slate-50`}>{p.active ? "숨기기" : "노출"}</button>
                  <button onClick={() => setEditing(p)} className={`rounded-md border border-slate-300 px-3 py-1.5 ${T_SMALL} font-semibold text-slate-600 hover:bg-slate-50`}>✎ 수정</button>
                  <button onClick={() => remove(p)} className={`rounded-md border border-red-200 px-3 py-1.5 ${T_SMALL} font-semibold text-red-500 hover:bg-red-50`}>🗑 삭제</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== undefined && <PopupForm initial={editing ?? undefined} nextOrder={popups.length} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function PopupForm({ initial, nextOrder, onClose }: { initial?: Popup; nextOrder: number; onClose: () => void }) {
  const [f, setF] = useState<PopupInput>(() => {
    if (!initial) {
      return { title: "", image: "", link: "/notice", newWindow: false, active: true, startDate: "", endDate: "", order: nextOrder };
    }
    const { id: _id, createdAt: _c, ...rest } = initial;
    return rest;
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof PopupInput>(k: K, v: PopupInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.image) {
      alert("팝업 이미지를 등록해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const data = { ...f, link: f.link.trim() };
      if (initial) await updatePopup(initial.id, data);
      else await addPopup(data);
      onClose();
    } catch (err) {
      alert("저장 실패: " + (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={save} className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white px-6 pt-6 pb-0 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">{initial ? "팝업 수정" : "팝업 등록"}</h2>
          <button type="button" onClick={onClose} className="shrink-0 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 transition hover:text-slate-600" aria-label="닫기">✕</button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>제목 (관리용)</label>
            <input className={INPUT} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="예) 10월 이벤트 안내" />
          </div>
          <div>
            <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>팝업 이미지 *</label>
            <ImageUploader dir="popups" value={f.image || undefined} onChange={(v) => set("image", v ?? "")} textClass={T_SMALL} />
            <p className={`mt-1 ${T_SMALL} text-slate-400`}>권장 비율 세로형 4:5 (예: 800×1000px). 모바일에서도 화면에 맞게 줄어듭니다.</p>
          </div>
          <div>
            <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>클릭 시 이동 링크</label>
            <input className={INPUT} value={f.link} onChange={(e) => set("link", e.target.value)} placeholder="/notice 또는 https://…" />
            <p className={`mt-1 ${T_SMALL} text-slate-400`}>공지사항&amp;뉴스 게시판: <b>/notice</b> · 비우면 클릭해도 이동하지 않습니다.</p>
            <label className={`mt-2 flex items-center gap-2 ${T_SMALL} font-semibold text-slate-600`}>
              <input type="checkbox" checked={f.newWindow} onChange={(e) => set("newWindow", e.target.checked)} />
              새 창으로 열기
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3 max-[501px]:grid-cols-1">
            <div>
              <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>시작일 (비우면 즉시)</label>
              <input type="date" className={INPUT} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </div>
            <div>
              <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>종료일 (비우면 계속)</label>
              <input type="date" className={INPUT} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 max-[501px]:grid-cols-1">
            <div>
              <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>표시 순서 (작을수록 먼저)</label>
              <input type="number" className={INPUT} value={f.order} onChange={(e) => set("order", Number(e.target.value) || 0)} />
            </div>
            <label className={`flex items-end gap-2 pb-2 ${T_SMALL} font-semibold text-slate-600`}>
              <input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />
              사이트에 노출
            </label>
          </div>
        </div>
        <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className={`rounded-lg border border-slate-300 px-5 py-2.5 ${T_BODY} font-semibold text-slate-600 hover:bg-slate-50`}>취소</button>
          <button type="submit" disabled={saving} className={`rounded-lg bg-navy px-5 py-2.5 ${T_BODY} font-semibold text-white hover:bg-navy-dark disabled:opacity-50`}>{saving ? "저장 중…" : "저장"}</button>
        </div>
      </form>
    </div>
  );
}
