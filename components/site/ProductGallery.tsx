"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * 상세 '상품정보' 탭 상단 이미지 — 여러 장을 큰 화면에서 넘겨 본다.
 * 화살표 · 아래 썸네일 클릭 · 마우스 드래그 · 모바일 스와이프 모두 지원.
 * 사진이 1장이면 컨트롤 없이 그 한 장만, 0장이면 권역 그라데이션을 보여준다.
 */
const SWIPE_PX = 45; // 이만큼 끌면 다음/이전 장으로 넘어간다

export default function ProductGallery({
  images,
  alt,
  fallbackClass,
}: {
  images: string[];
  alt: string;
  fallbackClass: string; // 사진이 없을 때 쓸 배경 (권역별 그라데이션)
}) {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0); // 끄는 중 손가락/커서를 따라가는 거리
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  const n = images.length;
  const cur = Math.min(i, Math.max(n - 1, 0));

  // 끝에서 더 끌면 고무줄처럼 조금만 밀린다 (넘어갈 곳이 없다는 신호)
  const resist = (d: number) =>
    (d > 0 && cur === 0) || (d < 0 && cur === n - 1) ? d / 4 : d;

  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (n < 2) return;
    startX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return;
    setDx(resist(e.clientX - startX.current));
  };
  const up = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startX.current == null) return;
    const d = e.clientX - startX.current;
    startX.current = null;
    setDragging(false);
    setDx(0);
    if (d <= -SWIPE_PX) setI((v) => Math.min(v + 1, n - 1)); // 왼쪽으로 끌면 다음 장
    else if (d >= SWIPE_PX) setI((v) => Math.max(v - 1, 0));
  };

  if (n === 0) return <div className={`aspect-[4/3] w-full ${fallbackClass}`} />;

  const arrow =
    "absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-[24px] leading-none text-white backdrop-blur-sm transition hover:bg-black/55 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div>
      {/* 칸 비율은 4:3으로 고정하되 object-contain 이라 원본이 잘리지 않는다 (남는 쪽에 흰 여백).
          touch-pan-y — 세로 스크롤은 페이지에 넘기고 가로 제스처만 갤러리가 받는다. */}
      <div
        className={`relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden bg-white ${
          n > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div
          className="flex h-full"
          style={{
            transform: `translateX(calc(${-cur * 100}% + ${dx}px))`,
            transition: dragging ? "none" : "transform 300ms ease",
          }}
        >
          {images.map((u, k) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${u}-${k}`}
              src={u}
              alt={k === cur ? alt : ""}
              draggable={false}
              className="h-full w-full shrink-0 object-contain"
            />
          ))}
        </div>

        {n > 1 && (
          <>
            {/* 화살표·카운터는 드래그 대상이 아니므로 pointerdown 을 위로 넘기지 않는다 */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setI((v) => Math.max(v - 1, 0))}
              disabled={cur === 0}
              aria-label="이전 사진"
              className={`${arrow} left-3`}
            >
              ‹
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setI((v) => Math.min(v + 1, n - 1))}
              disabled={cur === n - 1}
              aria-label="다음 사진"
              className={`${arrow} right-3`}
            >
              ›
            </button>
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-white">
              {cur + 1} / {n}
            </span>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((u, k) => (
            <button
              key={`${u}-${k}`}
              onClick={() => setI(k)}
              aria-label={`${k + 1}번째 사진 보기`}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-md bg-white transition max-[501px]:h-14 max-[501px]:w-20 ${
                k === cur ? "ring-2 ring-brand" : "opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" draggable={false} className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
