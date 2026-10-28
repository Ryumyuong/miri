"use client";

import { useState } from "react";
import { useNotices } from "@/lib/useNotices";
import { addNotice, updateNotice, deleteNotice, type Notice, type NoticeInput } from "@/lib/notices";
import RichText from "@/components/admin/RichText";
import ImageUploader from "@/components/ImageUploader";

const T_BODY = "text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]";
const T_SMALL = "text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw]";

export default function NoticeManager() {
  const { notices, loading } = useNotices();
  const [editing, setEditing] = useState<Notice | null | undefined>(undefined);

  const remove = async (n: Notice) => {
    if (confirm(`"${n.title}" 공지를 삭제할까요?`)) await deleteNotice(n.id);
  };
  const togglePin = (n: Notice) => updateNotice(n.id, { pinned: !n.pinned });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 max-[501px]:flex-col max-[501px]:gap-3">
        <div>
          <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">공지사항&amp;뉴스 관리</h1>
          <p className={`mt-1 ${T_BODY} text-slate-400`}>고객센터 &gt; 공지사항&amp;뉴스에 노출되는 글을 등록·수정·삭제합니다</p>
        </div>
        <button onClick={() => setEditing(null)} className={`shrink-0 rounded-lg bg-navy px-4 py-2 ${T_BODY} font-semibold text-white hover:bg-navy-dark max-[501px]:self-end`}>+ 공지 등록</button>
      </div>

      {loading ? (
        <p className={`py-16 text-center ${T_BODY} text-slate-400`}>불러오는 중…</p>
      ) : notices.length === 0 ? (
        <div className={`rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center ${T_BODY} text-slate-400`}>
          등록된 공지사항이 없습니다. <b>공지 등록</b>으로 시작하세요.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {notices.map((n) => (
            <div key={n.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 max-[501px]:flex-wrap">
              <button
                onClick={() => togglePin(n)}
                title={n.pinned ? "상단 고정 해제" : "상단 고정"}
                className={`shrink-0 rounded-md px-2 py-1 ${T_SMALL} font-semibold ${n.pinned ? "bg-[#1E4D8B] text-white" : "border border-slate-200 text-slate-400 hover:bg-slate-50"}`}
              >
                {n.pinned ? "고정" : "일반"}
              </button>
              <p className={`min-w-0 flex-1 truncate ${T_BODY} font-semibold text-slate-700`}>{n.title}</p>
              <span className={`shrink-0 ${T_SMALL} text-slate-400`}>{n.createdAt.slice(0, 10)}</span>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setEditing(n)} className={`rounded-md border border-slate-300 px-3 py-1.5 ${T_SMALL} font-semibold text-slate-600 hover:bg-slate-50`}>✎ 수정</button>
                <button onClick={() => remove(n)} className={`rounded-md border border-red-200 px-3 py-1.5 ${T_SMALL} font-semibold text-red-500 hover:bg-red-50`}>🗑 삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && <NoticeForm initial={editing ?? undefined} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function NoticeForm({ initial, onClose }: { initial?: Notice; onClose: () => void }) {
  const [f, setF] = useState<NoticeInput>(
    initial
      ? { title: initial.title, content: initial.content, pinned: initial.pinned, images: initial.images, videos: initial.videos }
      : { title: "", content: "", pinned: false, images: [], videos: [] },
  );
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial) await updateNotice(initial.id, f);
      else await addNotice(f);
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
          <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">{initial ? "공지사항&뉴스 수정" : "공지사항&뉴스 등록"}</h2>
          <button type="button" onClick={onClose} className="shrink-0 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 transition hover:text-slate-600" aria-label="닫기">✕</button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>제목</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[1.25em] outline-none focus:border-brand" value={f.title} onChange={(e) => setF((p) => ({ ...p, title: e.target.value }))} required />
          </div>
          <label className={`flex items-center gap-2 ${T_SMALL} font-semibold text-slate-600`}>
            <input type="checkbox" checked={f.pinned} onChange={(e) => setF((p) => ({ ...p, pinned: e.target.checked }))} />
            상단 고정 (중요 공지)
          </label>
          <div>
            <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>내용</label>
            <RichText value={f.content} onChange={(v) => setF((p) => ({ ...p, content: v }))} multiline />
            <p className={`mt-1 ${T_SMALL} text-slate-400`}>본문에 https:// 또는 www. 로 시작하는 주소를 입력하면 사이트에서 파란색 링크로 표시됩니다.</p>
          </div>
          <div>
            <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>첨부 이미지</label>
            <ImageUploader multiple dir="notices" value={f.images} onChange={(v) => setF((p) => ({ ...p, images: v }))} textClass={T_SMALL} />
          </div>
          <div>
            <label className={`mb-1 block ${T_SMALL} font-semibold text-slate-500`}>첨부 영상</label>
            <ImageUploader multiple video dir="notices" label="영상을 끌어다 놓거나 클릭하여 업로드" value={f.videos} onChange={(v) => setF((p) => ({ ...p, videos: v }))} textClass={T_SMALL} />
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
