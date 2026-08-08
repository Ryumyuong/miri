"use client";

import { useEffect, useRef, useState } from "react";

type KakaoSDK = {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: { sendDefault: (settings: unknown) => void };
};
declare global {
  interface Window {
    Kakao?: KakaoSDK;
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

function loadKakao(): Promise<KakaoSDK> {
  return new Promise((resolve, reject) => {
    if (window.Kakao) return resolve(window.Kakao);
    const s = document.createElement("script");
    s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";
    s.crossOrigin = "anonymous";
    s.onload = () => (window.Kakao ? resolve(window.Kakao) : reject(new Error("Kakao SDK 로드 실패")));
    s.onerror = () => reject(new Error("Kakao SDK 로드 실패"));
    document.head.appendChild(s);
  });
}

/** 공유하기 버튼 + 드롭다운 (문자 보내기 / 카카오톡 공유 / 링크 복사) */
export default function ShareMenu({
  title,
  description,
  imageUrl,
  className,
}: {
  title: string;
  description?: string;
  imageUrl?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const sendSms = () => {
    setOpen(false);
    const url = window.location.href;
    const body = `${title}\n${url}`;
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isMobile = isIOS || /Android/i.test(ua);

    if (isMobile) {
      // iOS는 `sms:&body=`, Android는 `sms:?body=` 형식에서 본문 자동입력이 안정적
      const href = isIOS
        ? `sms:&body=${encodeURIComponent(body)}`
        : `sms:?body=${encodeURIComponent(body)}`;
      window.location.href = href;
      return;
    }

    // PC 등 문자앱이 없는 환경 → 링크 복사로 대체
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(
        () => alert("문자앱을 열 수 없는 환경이라 링크를 복사했습니다.\n원하는 곳에 붙여넣어 공유해 주세요."),
        () => window.prompt("아래 링크를 복사해 공유해 주세요.", url),
      );
    } else {
      window.prompt("아래 링크를 복사해 공유해 주세요.", url);
    }
  };

  const shareKakao = async () => {
    setOpen(false);
    if (!KAKAO_KEY) {
      alert("카카오 공유 키가 설정되지 않았습니다.\n.env.local 에 NEXT_PUBLIC_KAKAO_JS_KEY 를 추가해 주세요.");
      return;
    }
    try {
      const Kakao = await loadKakao();
      if (!Kakao.isInitialized()) Kakao.init(KAKAO_KEY);
      const url = window.location.href;
      Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title,
          description: description ?? "미리크루즈 프리미엄 크루즈 여행",
          imageUrl: imageUrl || `${window.location.origin}/logo-miri.png`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{ title: "자세히 보기", link: { mobileWebUrl: url, webUrl: url } }],
      });
    } catch {
      alert("카카오톡 공유에 실패했습니다.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다.");
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative" style={{ fontSize: "var(--font-base)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/share.png" alt="" className="mr-[0.7em] inline-block h-[1em] w-[1em] align-middle object-contain" />
        공유하기
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-max min-w-[10em] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button type="button" onClick={sendSms} className="block w-full whitespace-nowrap px-4 py-2.5 text-left text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-600 hover:bg-slate-50">
            📩 문자 보내기
          </button>
          <button type="button" onClick={shareKakao} className="block w-full whitespace-nowrap px-4 py-2.5 text-left text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-600 hover:bg-slate-50">
            💬 카카오톡 공유
          </button>
          <button type="button" onClick={copyLink} className="block w-full whitespace-nowrap px-4 py-2.5 text-left text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-600 hover:bg-slate-50">
            🔗 링크 복사
          </button>
        </div>
      )}
    </div>
  );
}
