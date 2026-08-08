"use client";

import { useState } from "react";

/**
 * "영상으로 만나는 크루즈" — 관리자에 등록된 영상(제목+URL)을 캐러셀로 표시.
 *  재생 버튼을 누르면 YouTube 영상은 인라인 임베드, 그 외 URL은 새 탭으로 연다.
 */

type Video = { label: string; url: string };

function ytEmbed(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/,
  );
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null;
}

// 업로드한 영상 파일(직접 재생 가능한 URL) — 확장자 또는 Firebase Storage URL
function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url) || /firebasestorage\.googleapis\.com/.test(url);
}

// YouTube 썸네일 이미지 URL
function ytThumb(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/,
  );
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export default function VideoGallery({ videos }: { videos?: Video[] }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);

  // 영상이 없어도 섹션 틀(제목)은 표시하되, 영상 모양 대신 텍스트 안내
  if (!videos || videos.length === 0) {
    return (
      <section style={{ fontSize: "var(--font-base)" }}>
        <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-black text-navy">영상으로 만나는 크루즈</h2>
        <div className="rounded-xl border border-slate-200 bg-slate-50 py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          등록된 영상이 없습니다.
        </div>
      </section>
    );
  }

  const n = videos.length;
  const s = videos[Math.min(i, n - 1)];
  const go = (dir: number) => {
    setPlaying(false);
    setI((v) => (v + dir + n) % n);
  };

  const play = () => {
    if (ytEmbed(s.url) || isDirectVideo(s.url)) setPlaying(true); // YouTube·업로드 영상은 인라인 재생
    else window.open(s.url, "_blank"); // 그 외 URL만 새 탭
  };

  return (
    <section style={{ fontSize: "var(--font-base)" }}>
      <h2 className="mb-6 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-black text-navy">영상으로 만나는 크루즈</h2>

      {/* 영상 */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {playing && ytEmbed(s.url) ? (
          <iframe
            src={ytEmbed(s.url)!}
            title={s.label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : playing && isDirectVideo(s.url) ? (
          <video
            key={s.url}
            src={s.url}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full bg-black object-contain"
          />
        ) : (
          <button
            aria-label="영상 재생"
            onClick={play}
            className="group absolute inset-0 grid place-items-center bg-gradient-to-br from-sky-500 to-blue-800"
          >
            {/* 썸네일 = 영상 첫 프레임(업로드 영상) / YouTube 썸네일 */}
            {isDirectVideo(s.url) ? (
              <video
                key={s.url}
                src={`${s.url}#t=0.1`}
                muted
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : ytThumb(s.url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ytThumb(s.url)!} alt={s.label} className="absolute inset-0 h-full w-full object-cover" />
            ) : null}
            <span className="relative grid h-20 w-20 place-items-center rounded-full bg-white/30 backdrop-blur transition group-hover:bg-white/45">
              <span className="ml-1 border-y-[12px] border-l-[20px] border-y-transparent border-l-white" />
            </span>
          </button>
        )}
      </div>

      {/* 컨트롤 */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {n > 1 && (
            <button
              aria-label="이전 영상"
              onClick={() => go(-1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand hover:text-brand"
            >
              ‹
            </button>
          )}
          <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-navy">{s.label}</span>
          {n > 1 && (
            <button
              aria-label="다음 영상"
              onClick={() => go(1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand hover:text-brand"
            >
              ›
            </button>
          )}
        </div>
        {n > 1 && (
          <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
            <span className="font-bold text-navy">{Math.min(i, n - 1) + 1}</span> / {n}
          </span>
        )}
      </div>
    </section>
  );
}
