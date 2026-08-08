"use client";

import { useEffect, useRef, useState } from "react";

/** 요소가 뷰포트에 들어오면 inView=true (한 번만). 스크롤 등장 애니메이션용. */
/**
 * 요소가 뷰포트에 들어오면 inView=true (한 번만).
 * rootMargin 하단 음수(기본 -22%)로, 요소가 화면 아래에서 조금 더 올라와야 트리거됩니다.
 * (긴 섹션에서도 동작하도록 threshold는 0 사용)
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(rootMargin = "0px 0px -22% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}
