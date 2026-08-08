"use client";

import { useRef, useState } from "react";

/** 후기 첨부 이미지 슬라이더 — 메인 이미지 + 좌우 화살표 + 카운터 + 전체화면 + 썸네일 가로 스크롤(드래그).
 *  사용자 상세 페이지와 관리자 후기 상세 모달에서 공용으로 사용한다. */
export default function ReviewGallery({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  const [full, setFull] = useState(false);
  // 썸네일 드래그 스크롤 — 실제로 드래그가 시작될 때만 포인터 캡처(클릭 보존)
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false, captured: false, pid: 0 });
  const onDown = (e: React.PointerEvent) => {
    const el = stripRef.current;
    if (!el) return;
    drag.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false, captured: false, pid: e.pointerId };
  };
  const onMove = (e: React.PointerEvent) => {
    const el = stripRef.current;
    if (!el || !drag.current.down) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) {
      drag.current.moved = true;
      if (!drag.current.captured) { el.setPointerCapture(e.pointerId); drag.current.captured = true; }
    }
    if (drag.current.moved) el.scrollLeft = drag.current.startLeft - dx;
  };
  const onUp = () => {
    const el = stripRef.current;
    if (el && drag.current.captured) { try { el.releasePointerCapture(drag.current.pid); } catch {} }
    drag.current.down = false;
    drag.current.captured = false;
  };

  if (!images.length) return null;
  const cur = Math.min(idx, images.length - 1);
  const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black">
        {/* 메인 이미지 */}
        <div className="flex aspect-[16/10] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[cur]} alt={`${alt} ${cur + 1}`} className="max-h-full max-w-full object-contain" />
        </div>

        {/* 전체화면 버튼 */}
        <button
          onClick={() => setFull(true)}
          aria-label="전체화면"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-md bg-white/85 text-slate-700 shadow hover:bg-white"
        >
          <svg viewBox="0 0 24 24" className="h-[1.2em] w-[1.2em]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>

        {/* 좌우 화살표 */}
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="이전" className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-700 shadow hover:bg-white">‹</button>
            <button onClick={() => go(1)} aria-label="다음" className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-700 shadow hover:bg-white">›</button>
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[min(0.693vw,13.3056px)] max-[991px]:text-[min(2.1585vw,12.951px)] max-[501px]:text-[2.6213vw] font-medium text-white">
              {cur + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* 썸네일 — 1줄 가로 스크롤(드래그 슬라이드, 스크롤바 숨김) */}
      {images.length > 1 && (
        <div
          ref={stripRef}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="mt-3 flex cursor-grab gap-2 overflow-x-auto pb-1 select-none touch-pan-x [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src + i}
              src={src}
              alt=""
              draggable={false}
              onClick={() => { if (!drag.current.moved) setIdx(i); }}
              className={`h-16 w-24 shrink-0 cursor-pointer rounded-md object-cover transition ${
                i === cur ? "ring-2 ring-[#1E4D8B]" : "opacity-70 hover:opacity-100"
              }`}
            />
          ))}
        </div>
      )}

      {/* 전체화면 모달 */}
      {full && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setFull(false)}>
          <button aria-label="닫기" className="absolute right-5 top-5 text-[min(1.54vw,29.568px)] max-[991px]:text-[min(4.7966vw,28.7796px)] max-[501px]:text-[5.8252vw] text-white/80 hover:text-white">✕</button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[cur]} alt={`${alt} ${cur + 1}`} className="max-h-[90vh] max-w-[92vw] object-contain" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="이전" className="absolute left-5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-[min(1.232vw,23.6544px)] max-[991px]:text-[min(3.8373vw,23.0238px)] max-[501px]:text-[4.6602vw] text-white hover:bg-white/30">‹</button>
              <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="다음" className="absolute right-5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-[min(1.232vw,23.6544px)] max-[991px]:text-[min(3.8373vw,23.0238px)] max-[501px]:text-[4.6602vw] text-white hover:bg-white/30">›</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
