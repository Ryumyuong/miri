"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePopups } from "@/lib/usePopups";
import { isPopupLive, localToday, type Popup } from "@/lib/popups";

const HIDE_KEY = "miri-popup-hide"; // "오늘 하루 보지 않기" — 값: { [팝업 id]: 숨긴 날짜(YYYY-MM-DD) }
const T_BTN = "text-[min(0.8085vw,15.5232px)] max-[991px]:text-[min(2.5182vw,15.1092px)] max-[501px]:text-[3.3vw]";

function readHidden(): Record<string, string> {
  try {
    const v = JSON.parse(localStorage.getItem(HIDE_KEY) ?? "{}");
    return v && typeof v === "object" ? v : {}; // 예전 형식(날짜 문자열)은 무시
  } catch {
    return {};
  }
}

/**
 * 메인 화면 팝업 — 관리자 > 팝업 관리에서 등록한 이미지.
 * 여러 개면 창도 여러 개가 동시에 뜸: PC(>990px)는 표시 순서대로 나란히(넘치면 줄바꿈), 모바일은 위아래로 쌓아 스크롤.
 * 닫기 / 오늘 하루 보지 않기는 팝업마다 따로 적용.
 */
export default function SitePopup() {
  const { popups, loading } = usePopups();
  const router = useRouter();
  const [ready, setReady] = useState(false); // 저장값 확인 전엔 숨김 (깜빡임 방지)
  const [closed, setClosed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const today = localToday();
    const hidden = readHidden();
    setClosed(new Set(Object.keys(hidden).filter((id) => hidden[id] === today)));
    setReady(true);
  }, []);

  const live = popups.filter((p) => isPopupLive(p) && !closed.has(p.id));
  if (loading || !ready || live.length === 0) return null;

  const close = (id: string) => setClosed((s) => new Set(s).add(id));
  const closeAll = () => setClosed((s) => new Set([...s, ...live.map((p) => p.id)]));
  const hideToday = (id: string) => {
    try {
      const today = localToday();
      const hidden = readHidden();
      // 지난 날짜 기록은 정리하고 저장
      const next = Object.fromEntries(Object.entries(hidden).filter(([, d]) => d === today));
      localStorage.setItem(HIDE_KEY, JSON.stringify({ ...next, [id]: today }));
    } catch {}
    close(id);
  };
  const go = (p: Popup) => {
    const link = p.link.trim();
    if (!link) return;
    if (p.newWindow) {
      window.open(link, "_blank", "noopener,noreferrer");
    } else if (link.startsWith("/")) {
      closeAll();
      router.push(link);
    } else {
      window.location.href = link;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto bg-black/50 p-4"
      onClick={closeAll}
      role="dialog"
      aria-modal="true"
      aria-label="알림 팝업"
    >
      <div className="flex min-h-full flex-wrap items-center justify-center gap-4 max-[991px]:flex-col max-[991px]:flex-nowrap max-[991px]:py-4">
        {live.map((p) => (
          <div
            key={p.id}
            className="relative w-full max-w-[380px] shrink-0 overflow-hidden rounded-xl bg-white shadow-2xl max-[991px]:max-w-[420px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 이미지 — 클릭 시 링크 이동 */}
            <button type="button" onClick={() => go(p)} className={`block w-full ${p.link ? "cursor-pointer" : "cursor-default"}`} aria-label={p.title || "팝업 이미지"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.title || "팝업"} className="block max-h-[70vh] w-full bg-slate-50 object-contain" />
            </button>

            {/* 하단 버튼 */}
            <div className={`flex divide-x divide-slate-200 border-t border-slate-200 ${T_BTN}`}>
              <button type="button" onClick={() => hideToday(p.id)} className="flex-1 py-3 text-slate-500 transition hover:bg-slate-50">오늘 하루 보지 않기</button>
              <button type="button" onClick={() => close(p.id)} className="flex-1 py-3 font-semibold text-slate-800 transition hover:bg-slate-50">
                닫기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
