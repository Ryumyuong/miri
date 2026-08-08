"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * 네이버 애널리틱스(wcs) — 모든 페이지 설치.
 * 최초 로드 + 클라이언트 라우팅(페이지 이동) 시마다 페이지뷰를 기록한다.
 * (SPA에서는 새로고침이 없어, 라우팅마다 _nasa를 초기화하고 wcs_do를 다시 호출해야 집계됨)
 */
const WA = "s_34e9bc1156e6";

function track() {
  const w = window as unknown as {
    wcs_add?: Record<string, string>;
    _nasa?: Record<string, unknown>;
    wcs?: { inflow?: () => void };
    wcs_do?: (n?: Record<string, unknown>) => void;
  };
  if (!w.wcs) return; // wcslog.js 아직 미로드
  w.wcs_add = w.wcs_add || {};
  w.wcs_add["wa"] = WA;
  w._nasa = {}; // 페이지뷰마다 초기화
  if (typeof w.wcs.inflow === "function") w.wcs.inflow();
  if (typeof w.wcs_do === "function") w.wcs_do(w._nasa);
}

export default function NaverAnalytics() {
  const pathname = usePathname();
  const loaded = useRef(false);

  // 라우팅 변경 시마다 페이지뷰 기록 (스크립트 로드 완료 후에만)
  useEffect(() => {
    if (loaded.current) track();
  }, [pathname]);

  return (
    <Script
      id="wcslog"
      src="//wcs.naver.net/wcslog.js"
      strategy="afterInteractive"
      onLoad={() => {
        loaded.current = true;
        track(); // 최초 진입 페이지뷰
      }}
    />
  );
}
