"use client";

import { useEffect, useRef, useState } from "react";

/** 부분 텍스트 서식 WYSIWYG — 선택 영역에 서식 적용, HTML 저장 (워드형 툴바) */

// 글자색 팔레트 (10열, 워드/구글닥스형)
const PALETTE = [
  "#000000", "#434343", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF",
  "#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF",
  "#E6B8AF", "#F4CCCC", "#FCE5CD", "#FFF2CC", "#D9EAD3", "#D0E0E3", "#C9DAF8", "#CFE2F3", "#D9D2E9", "#EAD1DC",
  "#DD7E6B", "#EA9999", "#F9CB9C", "#FFE599", "#B6D7A8", "#A2C4C9", "#A4C2F4", "#9FC5E8", "#B4A7D6", "#D5A6BD",
  "#CC4125", "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6D9EEB", "#6FA8DC", "#8E7CC3", "#C27BA0",
  "#A61C00", "#CC0000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3C78D8", "#3D85C6", "#674EA7", "#A64D79",
  "#85200C", "#990000", "#B45F06", "#BF9000", "#38761D", "#134F5C", "#1155CC", "#0B5394", "#351C75", "#741B47",
  "#5B0F00", "#660000", "#783F04", "#7F6000", "#274E13", "#0C343D", "#1C4587", "#073763", "#20124D", "#4C1130",
];

// 글꼴
const FONTS = [
  { label: "기본", f: "" },
  { label: "맑은 고딕", f: "'Malgun Gothic','맑은 고딕',sans-serif" },
  { label: "나눔고딕", f: "'Nanum Gothic',sans-serif" },
  { label: "노토 세리프", f: "'Noto Serif KR',serif" },
  { label: "바탕", f: "Batang,'바탕',serif" },
];

// 글자 크기(px)
const SIZES = [6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20, 24, 28, 32];

// 기호 팔레트
const SYMBOLS = [
  "※", "●", "○", "■", "□", "▶", "▷", "★", "☆", "◆", "◇",
  "·", "・", "ㆍ", "—", "–", "→", "←", "↑", "↓", "⇒", "⇔",
  "✓", "✔", "✕", "√", "①", "②", "③", "④", "⑤", "⑥",
  "㉠", "㉡", "℃", "₩", "＄", "€", "±", "×", "÷", "°", "™", "©",
  "「", "」", "『", "』", "【", "】", "〔", "〕", "“", "”", "‘", "’",
];

/** 입력창 기본 글자 크기 — 미지정 시 기존(vw) 크기 */
const DEFAULT_EDIT_TEXT = "text-[min(1.08vw,20.736px)] max-[991px]:text-[min(2.62vw,15.72px)] max-[501px]:text-[3.18vw]";

export default function RichText({
  value,
  onChange,
  multiline,
  textClass = DEFAULT_EDIT_TEXT,
}: {
  value?: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  /** 실제 상세페이지에 나갈 크기를 넘기면 입력창도 같은 크기로 보인다 (보이는 대로 = 나가는 대로) */
  textClass?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [symOpen, setSymOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [curColor, setCurColor] = useState("#DC2626");
  const [hlOpen, setHlOpen] = useState(false);
  const [curHl, setCurHl] = useState("#FEF08A");

  // 최초 1회만 주입 (제어 렌더로 인한 커서 튐 방지)
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value ?? "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = () => onChange(ref.current?.innerHTML ?? "");

  // 붙여넣기: 서식(특히 글자 크기·글꼴)을 제거하고 기본 폰트로 삽입.
  // → 복붙해도 기본 크기로 들어가고, 크기/글꼴은 드롭다운으로만 지정.
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    commit();
  };

  // 편집기 안의 현재 선택 영역 저장 (select 클릭 시 선택이 사라지는 것 대비)
  const saveSel = () => {
    const s = window.getSelection();
    if (s && s.rangeCount && ref.current?.contains(s.anchorNode)) {
      savedRange.current = s.getRangeAt(0).cloneRange();
    }
  };
  const restoreSel = () => {
    const r = savedRange.current;
    if (!r) return;
    const s = window.getSelection();
    s?.removeAllRanges();
    s?.addRange(r);
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    try {
      document.execCommand("styleWithCSS", false, "true");
    } catch {}
    document.execCommand(cmd, false, arg);
    commit();
  };

  // 실제 px 크기 적용 (execCommand fontSize는 1~7뿐이라 span으로 치환)
  const setSize = (px: number) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    restoreSel();
    document.execCommand("fontSize", false, "7");
    el.querySelectorAll('font[size="7"]').forEach((f) => {
      const span = document.createElement("span");
      span.style.fontSize = `${px}px`;
      span.innerHTML = (f as HTMLElement).innerHTML;
      f.replaceWith(span);
    });
    commit();
  };

  const setFont = (f: string) => {
    if (!f) return;
    ref.current?.focus();
    restoreSel();
    exec("fontName", f);
  };

  const setColor = (hex: string) => {
    setCurColor(hex);
    ref.current?.focus();
    restoreSel();
    exec("foreColor", hex);
    setColorOpen(false);
  };

  const setHilite = (hex: string) => {
    if (hex !== "transparent") setCurHl(hex);
    ref.current?.focus();
    restoreSel();
    exec("hiliteColor", hex);
    setHlOpen(false);
  };

  const insertSymbol = (s: string) => {
    ref.current?.focus();
    document.execCommand("insertText", false, s);
    commit();
    setSymOpen(false);
  };

  const btn = "rounded px-2 py-0.5 text-[1.3em] max-[501px]:text-[2.7vw] font-semibold text-slate-600 transition hover:bg-slate-100";
  const sel = "rounded border border-slate-200 bg-white px-1 py-0.5 text-[1.2em] max-[501px]:text-[2.5vw] text-slate-600 outline-none";
  const keep = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="rounded-[10px] border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-1.5 py-1">
        {/* 글꼴 */}
        <select
          className={sel}
          defaultValue=""
          onChange={(e) => { setFont(e.target.value); e.target.value = ""; }}
          title="글꼴"
        >
          <option value="" disabled>글꼴</option>
          {FONTS.map((f) => <option key={f.label} value={f.f}>{f.label}</option>)}
        </select>

        {/* 크기(px) */}
        <select
          className={sel}
          defaultValue=""
          onChange={(e) => { setSize(Number(e.target.value)); e.target.value = ""; }}
          title="글자 크기"
        >
          <option value="" disabled>크기</option>
          {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <span className="mx-0.5 h-4 w-px bg-slate-200" />

        {/* 서식 */}
        <button type="button" onMouseDown={keep} onClick={() => exec("bold")} className={`${btn} font-bold`}>가</button>
        <button type="button" onMouseDown={keep} onClick={() => exec("italic")} className={`${btn} italic`}>가</button>
        <button type="button" onMouseDown={keep} onClick={() => exec("underline")} className={`${btn} underline`}>가</button>
        <button type="button" onMouseDown={keep} onClick={() => exec("strikeThrough")} className={`${btn} line-through`}>가</button>

        <span className="mx-0.5 h-4 w-px bg-slate-200" />

        {/* 글자색 (팔레트) */}
        <div className="relative">
          <button
            type="button"
            title="글자색"
            onMouseDown={keep}
            onClick={() => { saveSel(); setColorOpen((v) => !v); }}
            className="flex flex-col items-center rounded px-1 py-0.5 hover:bg-slate-100"
          >
            <span className="text-[min(0.85vw,16.32px)] max-[991px]:text-[min(1.6788vw,10.0728px)] max-[501px]:text-[1.75vw] font-bold leading-none text-slate-700">가</span>
            <span className="mt-0.5 h-1 w-4 rounded-sm" style={{ background: curColor }} />
          </button>
          {colorOpen && (
            <div
              onMouseDown={keep}
              className="absolute left-0 top-full z-50 mt-1 w-[16em] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            >
              <div className="grid grid-cols-10 gap-1">
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    onMouseDown={keep}
                    onClick={() => setColor(hex)}
                    className="aspect-square w-full rounded-[2px] border border-black/10 transition hover:scale-110"
                    style={{ background: hex }}
                  />
                ))}
              </div>
              <label className="mt-2 flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-t border-slate-100 pt-2 text-[min(0.5544vw,10.6445px)] max-[991px]:text-[min(1.7268vw,10.3608px)] max-[501px]:text-[2.0971vw] text-slate-500">
                사용자 지정
                <input
                  type="color"
                  value={curColor}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-5 w-6 cursor-pointer rounded border border-slate-200 bg-white p-0"
                />
              </label>
            </div>
          )}
        </div>

        <span className="mx-0.5 h-4 w-px bg-slate-200" />

        {/* 형광펜 (팔레트) */}
        <div className="relative">
          <button
            type="button"
            title="형광펜"
            onMouseDown={keep}
            onClick={() => { saveSel(); setHlOpen((v) => !v); }}
            className="flex flex-col items-center rounded px-1 py-0.5 hover:bg-slate-100"
          >
            <span className="text-[min(0.85vw,16.32px)] max-[991px]:text-[min(1.6788vw,10.0728px)] max-[501px]:text-[1.75vw] font-bold leading-none text-slate-700">형광펜</span>
            <span className="mt-0.5 h-1 w-full rounded-sm" style={{ background: curHl }} />
          </button>
          {hlOpen && (
            <div
              onMouseDown={keep}
              className="absolute left-0 top-full z-50 mt-1 w-[16em] rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            >
              <button
                type="button"
                onMouseDown={keep}
                onClick={() => setHilite("transparent")}
                className="mb-1.5 w-full rounded border border-slate-200 py-1 text-[min(0.5544vw,10.6445px)] max-[991px]:text-[min(1.7268vw,10.3608px)] max-[501px]:text-[2.0971vw] text-slate-500 hover:bg-slate-50"
              >
                형광펜 없음
              </button>
              <div className="grid grid-cols-10 gap-1">
                {PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    onMouseDown={keep}
                    onClick={() => setHilite(hex)}
                    className="aspect-square w-full rounded-[2px] border border-black/10 transition hover:scale-110"
                    style={{ background: hex }}
                  />
                ))}
              </div>
              <label className="mt-2 flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-t border-slate-100 pt-2 text-[min(0.5544vw,10.6445px)] max-[991px]:text-[min(1.7268vw,10.3608px)] max-[501px]:text-[2.0971vw] text-slate-500">
                사용자 지정
                <input
                  type="color"
                  value={curHl}
                  onChange={(e) => setHilite(e.target.value)}
                  className="h-5 w-6 cursor-pointer rounded border border-slate-200 bg-white p-0"
                />
              </label>
            </div>
          )}
        </div>

        <span className="mx-0.5 h-4 w-px bg-slate-200" />

        {/* 기호 삽입 */}
        <div className="relative">
          <button type="button" onMouseDown={keep} onClick={() => setSymOpen((v) => !v)} className={btn}>기호 Ω</button>
          {symOpen && (
            <div
              onMouseDown={keep}
              className="absolute left-0 top-full z-50 mt-1 grid w-[15em] grid-cols-9 gap-0.5 rounded-lg border border-slate-200 bg-white p-2 shadow-lg"
            >
              {SYMBOLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseDown={keep}
                  onClick={() => insertSymbol(s)}
                  className="grid h-5 w-5 place-items-center rounded text-[min(0.6545vw,12.5664px)] max-[991px]:text-[min(2.0386vw,12.2316px)] max-[501px]:text-[2.4757vw] text-slate-700 hover:bg-slate-100"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={commit}
        onPaste={onPaste}
        onKeyUp={saveSel}
        onMouseUp={saveSel}
        onSelect={saveSel}
        onBlur={() => setSymOpen(false)}
        className={`px-3 py-2 ${textClass} font-medium text-[#364153] outline-none ${multiline ? "min-h-[3.5em]" : ""}`}
        style={{ fontFamily: "Inter, var(--font-sans)", whiteSpace: "pre-wrap" }}
      />
    </div>
  );
}
