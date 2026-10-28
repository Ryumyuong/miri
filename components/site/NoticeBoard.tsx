"use client";

import { useState } from "react";
import { useNotices } from "@/lib/useNotices";
import { linkify } from "@/lib/linkify";

const T_TITLE = "text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]";
const T_BODY = "text-[min(0.8085vw,15.5232px)] max-[991px]:text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.0582vw]";
const T_META = "text-[min(0.7315vw,14.0448px)] max-[991px]:text-[min(2.2784vw,13.6704px)] max-[501px]:text-[2.767vw]";

const PER_PAGE = 10;

export default function NoticeBoard() {
  const { notices, loading } = useNotices();
  const [open, setOpen] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(notices.length / PER_PAGE));
  const cur = Math.min(page, pageCount);
  const shown = notices.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  return (
    <div className="mx-auto w-full max-w-3xl px-5" style={{ fontSize: "var(--font-base)" }}>
      {loading ? (
        <p className={`py-16 text-center ${T_BODY} text-slate-400`}>불러오는 중…</p>
      ) : notices.length === 0 ? (
        <p className={`rounded-xl bg-slate-50 py-16 text-center ${T_BODY} text-slate-400`}>등록된 공지사항이 없습니다.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {shown.map((n) => {
              const on = open === n.id;
              return (
                <div key={n.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <button onClick={() => setOpen(on ? null : n.id)} className="flex w-full items-center gap-3 px-5 py-4 text-left">
                    {n.pinned && (
                      <span className={`shrink-0 bg-[#1E4D8B] px-2 py-0.5 ${T_META} font-semibold text-white`}>공지</span>
                    )}
                    <span className={`min-w-0 flex-1 ${T_TITLE} font-semibold text-navy`}>{n.title}</span>
                    <span className={`shrink-0 ${T_META} text-slate-400`}>{n.createdAt.slice(0, 10).replaceAll("-", ".")}</span>
                    <span className="text-slate-400">{on ? "▲" : "▼"}</span>
                  </button>
                  {on && (
                    <div className="border-t border-slate-100 px-5 py-4">
                      {/* 관리자 RichText(HTML) 본문 — 줄바꿈·서식 유지, URL은 파란색 링크로 */}
                      <div
                        className={`whitespace-pre-line break-words ${T_BODY} leading-relaxed text-slate-600`}
                        dangerouslySetInnerHTML={{ __html: linkify(n.content) }}
                      />
                      {(n.images.length > 0 || n.videos.length > 0) && (
                        <div className="mt-4 flex flex-col gap-3">
                          {n.images.map((src, i) => (
                            <a key={src} href={src} target="_blank" rel="noopener noreferrer" title="원본 보기">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={`${n.title} 첨부 이미지 ${i + 1}`} className="w-full rounded-lg border border-slate-100" loading="lazy" />
                            </a>
                          ))}
                          {n.videos.map((src) => (
                            <video key={src} src={src} controls playsInline preload="metadata" className="w-full rounded-lg bg-black" />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="mt-8 flex justify-center gap-1.5">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); setOpen(null); }}
                  className={`h-[2.4em] w-[2.4em] ${T_BODY} font-medium ${p === cur ? "bg-[#1E4D8B] text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
