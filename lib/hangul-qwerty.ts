/**
 * 한/영 오타 자동 변환 (2벌식 기준).
 *
 * 브라우저는 IME(한/영 상태)를 바꿀 수 없다. 대신 "잘못된 상태로 친 글자"를
 * 실제로 누른 키 기준으로 되돌려, 사용자가 한/영 키를 안 눌러도 되게 한다.
 *   영문칸에  ㅗㅐㅜㅎ  → hong
 *   한글칸에  rkskek    → 가나다
 *
 * 두 함수 모두 "문자열 전체를 낱자로 풀었다가 다시 조립"하는 방식이라
 * 이미 섞여 있는 입력(예: "가" + "s")도 정상 처리된다.
 */

// ── 2벌식 자판: 키 → 낱자 ─────────────────────────────
const KEY_TO_JAMO: Record<string, string> = {
  q: "ㅂ", w: "ㅈ", e: "ㄷ", r: "ㄱ", t: "ㅅ", y: "ㅛ", u: "ㅕ", i: "ㅑ", o: "ㅐ", p: "ㅔ",
  a: "ㅁ", s: "ㄴ", d: "ㅇ", f: "ㄹ", g: "ㅎ", h: "ㅗ", j: "ㅓ", k: "ㅏ", l: "ㅣ",
  z: "ㅋ", x: "ㅌ", c: "ㅊ", v: "ㅍ", b: "ㅠ", n: "ㅜ", m: "ㅡ",
  Q: "ㅃ", W: "ㅉ", E: "ㄸ", R: "ㄲ", T: "ㅆ", O: "ㅒ", P: "ㅖ",
};
// 낱자 → 키 (역매핑). 대문자 전용 낱자(ㅃㅉㄸㄲㅆㅒㅖ)가 소문자에 덮이지 않도록 소문자를 먼저 넣는다.
const JAMO_TO_KEY: Record<string, string> = {};
for (const [k, j] of Object.entries(KEY_TO_JAMO)) if (!JAMO_TO_KEY[j]) JAMO_TO_KEY[j] = k;

const CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
const JUNG = ["ㅏ","ㅐ","ㅑ","ㅒ","ㅓ","ㅔ","ㅕ","ㅖ","ㅗ","ㅘ","ㅙ","ㅚ","ㅛ","ㅜ","ㅝ","ㅞ","ㅟ","ㅠ","ㅡ","ㅢ","ㅣ"];
const JONG = ["","ㄱ","ㄲ","ㄳ","ㄴ","ㄵ","ㄶ","ㄷ","ㄹ","ㄺ","ㄻ","ㄼ","ㄽ","ㄾ","ㄿ","ㅀ","ㅁ","ㅂ","ㅄ","ㅅ","ㅆ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

// 겹모음·겹받침 → 낱자 두 개 (키 두 번 누른 것)
const SPLIT: Record<string, [string, string]> = {
  "ㅘ": ["ㅗ","ㅏ"], "ㅙ": ["ㅗ","ㅐ"], "ㅚ": ["ㅗ","ㅣ"],
  "ㅝ": ["ㅜ","ㅓ"], "ㅞ": ["ㅜ","ㅔ"], "ㅟ": ["ㅜ","ㅣ"], "ㅢ": ["ㅡ","ㅣ"],
  "ㄳ": ["ㄱ","ㅅ"], "ㄵ": ["ㄴ","ㅈ"], "ㄶ": ["ㄴ","ㅎ"],
  "ㄺ": ["ㄹ","ㄱ"], "ㄻ": ["ㄹ","ㅁ"], "ㄼ": ["ㄹ","ㅂ"], "ㄽ": ["ㄹ","ㅅ"],
  "ㄾ": ["ㄹ","ㅌ"], "ㄿ": ["ㄹ","ㅍ"], "ㅀ": ["ㄹ","ㅎ"], "ㅄ": ["ㅂ","ㅅ"],
};
// 낱자 두 개 → 겹모음·겹받침 (조립용, SPLIT 의 역방향)
const MERGE: Record<string, string> = {};
for (const [pair, [a, b]] of Object.entries(SPLIT)) MERGE[a + b] = pair;

const BASE = 0xac00;
const LAST = 0xd7a3;
const isSyllable = (c: string) => c.charCodeAt(0) >= BASE && c.charCodeAt(0) <= LAST;
const isJamo = (c: string) => c.charCodeAt(0) >= 0x3131 && c.charCodeAt(0) <= 0x3163;

/** 문자열을 낱자 배열로 분해. 한글 아닌 글자는 그대로 통과. */
function toJamo(s: string): string[] {
  const out: string[] = [];
  const push = (j: string) => {
    const p = SPLIT[j];
    if (p) out.push(p[0], p[1]);
    else out.push(j);
  };
  for (const c of s) {
    if (isSyllable(c)) {
      const code = c.charCodeAt(0) - BASE;
      push(CHO[Math.floor(code / 588)]);
      push(JUNG[Math.floor((code % 588) / 28)]);
      const jong = JONG[code % 28];
      if (jong) push(jong);
    } else if (isJamo(c)) {
      push(c);
    } else {
      out.push(c);
    }
  }
  return out;
}

/** 한글 → 실제로 누른 알파벳. ("ㅗㅐㅜㅎ" → "hong") */
export function hangulToQwerty(s: string): string {
  return toJamo(s)
    .map((j) => JAMO_TO_KEY[j] ?? j)
    .join("");
}

/** 알파벳 → 원래 치려던 한글. ("rkskek" → "가나다") */
export function qwertyToHangul(s: string): string {
  // 1) 알파벳은 낱자로 바꾸고, 이미 한글인 부분은 낱자로 풀어 이어 붙인다
  const jamo: string[] = [];
  for (const c of toJamo(s)) {
    const mapped = KEY_TO_JAMO[c];
    if (mapped) {
      const p = SPLIT[mapped];
      if (p) jamo.push(p[0], p[1]);
      else jamo.push(mapped);
    } else {
      jamo.push(c);
    }
  }

  // 2) 낱자 배열을 음절로 조립 (표준 오토마타)
  let out = "";
  let cho = -1, jung = -1, jong = 0;
  const flush = () => {
    if (cho >= 0 && jung >= 0) out += String.fromCharCode(BASE + (cho * 21 + jung) * 28 + jong);
    else if (cho >= 0) out += CHO[cho];
    else if (jung >= 0) out += JUNG[jung];
    cho = -1; jung = -1; jong = 0;
  };

  for (const j of jamo) {
    const vi = JUNG.indexOf(j);
    const ci = CHO.indexOf(j);
    const ji = JONG.indexOf(j);

    if (vi >= 0) {
      // 모음
      if (jong > 0) {
        // 받침이 다음 글자의 초성으로 넘어간다 (겹받침이면 뒷자만)
        const cur = JONG[jong];
        const p = SPLIT[cur];
        const moved = p ? p[1] : cur;
        jong = p ? JONG.indexOf(p[0]) : 0;
        flush();
        cho = CHO.indexOf(moved);
        jung = vi;
      } else if (cho >= 0 && jung < 0) {
        jung = vi;
      } else if (jung >= 0) {
        const merged = MERGE[JUNG[jung] + j];
        if (merged) jung = JUNG.indexOf(merged);
        else { flush(); jung = vi; }
      } else {
        flush();
        jung = vi;
      }
    } else if (ci >= 0 || ji > 0) {
      // 자음
      if (cho < 0) {
        flush();
        cho = ci;
      } else if (jung < 0) {
        flush();
        cho = ci;
      } else if (jong === 0) {
        if (ji > 0) jong = ji;
        else { flush(); cho = ci; }
      } else {
        const merged = MERGE[JONG[jong] + j];
        if (merged) jong = JONG.indexOf(merged);
        else { flush(); cho = ci; }
      }
    } else {
      // 한글이 아닌 글자 (공백·숫자 등) — 조립 중이던 글자를 끊고 그대로 출력
      flush();
      out += j;
    }
  }
  flush();
  return out;
}
