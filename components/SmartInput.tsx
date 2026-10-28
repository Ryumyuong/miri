"use client";

import { useRef } from "react";
import type { InputHTMLAttributes } from "react";
import { hangulToQwerty, qwertyToHangul } from "@/lib/hangul-qwerty";

/**
 * 한/영 자동 교정 입력칸 (관리자 승객정보 · 고객 가예약 신청 공용).
 *
 * 브라우저는 IME(한/영 상태)를 바꿀 수 없다. 대신 잘못된 상태로 친 글자를
 * 실제 누른 키 기준으로 되돌려, 한/영 키를 안 눌러도 되게 한다.
 *   ime="en"  영문칸  — 한글을 알파벳으로 ("ㅗㅐㅜㅎ" → "HONG")
 *   ime="ko"  한글칸  — 알파벳을 한글로 ("rkskek" → "가나다")
 *
 * - IME 조합 중에는 손대지 않고, 글자가 확정될 때(compositionend) 변환한다.
 * - 커서가 맨 끝일 때만 변환한다 (중간을 고칠 때 커서가 튀지 않도록).
 * - 포커스가 빠질 때 한 번 더 정리한다.
 */
export default function SmartInput({
  value,
  onChange,
  ime,
  upper,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  ime?: "ko" | "en";
  upper?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  const composing = useRef(false);

  const fix = (s: string) => {
    let out = s;
    if (ime === "en") out = hangulToQwerty(out);
    else if (ime === "ko") out = qwertyToHangul(out);
    return upper ? out.toUpperCase() : out;
  };
  const plain = (s: string) => (upper ? s.toUpperCase() : s);

  return (
    <input
      {...rest}
      value={value}
      onCompositionStart={() => (composing.current = true)}
      onCompositionEnd={(e) => {
        composing.current = false;
        onChange(fix(e.currentTarget.value));
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (composing.current) return onChange(plain(raw)); // 조합 중엔 그대로
        const atEnd = e.target.selectionStart === raw.length;
        onChange(atEnd ? fix(raw) : plain(raw));
      }}
      onBlur={(e) => onChange(fix(e.target.value))}
    />
  );
}

/** 전화번호 자동 하이픈 (010-0000-0000 / 02-000-0000) */
export function phoneMask(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.startsWith("02")) {
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}-${d.slice(2)}`;
    if (d.length <= 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`;
    return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6, 10)}`;
  }
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 주민번호 뒷자리 첫 숫자 → 성별 (1·3·5·7·9 남 / 2·4·6·8·0 여) */
export function genderFromRrn(back?: string): "남" | "여" | undefined {
  const d = (back ?? "").replace(/\D/g, "")[0];
  if (!d) return undefined;
  if ("13579".includes(d)) return "남";
  if ("24680".includes(d)) return "여";
  return undefined;
}
