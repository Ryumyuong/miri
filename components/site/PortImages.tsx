"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { portImages } from "@/lib/ports";

const SWIPE_PX = 45; // 이만큼 끌면 다음/이전 장으로

/**
 * 관광정보 카드 이미지 — 한 번에 한 장씩, 화살표·드래그·스와이프로 넘긴다.
 * 여러 장을 동시에 펼치면 카드마다 높이가 달라져 목록이 어긋나므로 슬라이드 방식으로 통일.
 * object-contain 이라 사진에 글자가 박혀 있어도 잘리지 않는다.
 * 관리자 목록 · 회사소개 여행지 탭 · 상품 상세 관광정보에서 공통으로 쓴다.
 */
export default function PortImages({
  card,
  alt,
  className = "",
  itemClass = "h-56",
  fallback,
}: {
  card: { images?: string[]; imageUrl?: string };
  alt: string;
  className?: string;
  /** 사진 칸의 높이 클래스 */
  itemClass?: string;
  /** 사진이 하나도 없을 때 대신 보여줄 배경 클래스 */
  fallback?: string;
}) {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);

  const imgs = portImages(card);
  const n = imgs.length;
  const cur = Math.min(i, Math.max(n - 1, 0));

  if (n === 0) {
    return (
      <div className={`${itemClass} w-full ${fallback ?? "bg-gradient-to-br from-sky-400 to-blue-700"} ${className}`} />
    );
  }

  // 끝에서 더 끌면 고무줄처럼 조금만 밀린다
  const resist = (d: number) => ((d > 0 && cur === 0) || (d < 0 && cur === n - 1) ? d / 4 : d);
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
    if (d <= -SWIPE_PX) setI((v) => Math.min(v + 1, n - 1));
    else if (d >= SWIPE_PX) setI((v) => Math.max(v - 1, 0));
  };

  const arrow =
    "absolute top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-[20px] leading-none text-white backdrop-blur-sm transition hover:bg-black/55 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div
      className={`relative ${itemClass} w-full touch-pan-y select-none overflow-hidden bg-white ${
        n > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
      } ${className}`}
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
        {imgs.map((src, k) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${k}`}
            src={src}
            alt={n > 1 ? `${alt} ${k + 1}` : alt}
            loading="lazy"
            draggable={false}
            className="h-full w-full shrink-0 object-contain object-top"
          />
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              setI((v) => Math.max(v - 1, 0));
            }}
            disabled={cur === 0}
            aria-label="이전 사진"
            className={`${arrow} left-2`}
          >
            ‹
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              setI((v) => Math.min(v + 1, n - 1));
            }}
            disabled={cur === n - 1}
            aria-label="다음 사진"
            className={`${arrow} right-2`}
          >
            ›
          </button>
          <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
            {cur + 1} / {n}
          </span>
        </>
      )}
    </div>
  );
}
