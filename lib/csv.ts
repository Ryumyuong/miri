import type { Passenger, Reservation } from "./types";

/** 만나이 계산 (생년월일 YYYY-MM-DD 기준). 기준일 미지정 시 오늘. */
export function koreanAge(birth?: string, refISO?: string): string {
  if (!birth) return "";
  const b = new Date(birth);
  if (isNaN(b.getTime())) return "";
  const ref = refISO ? new Date(refISO) : new Date();
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--;
  return age >= 0 ? String(age) : "";
}

/** CSV 컬럼 순서 (요청 사양 그대로 · 객실호수 제외) */
const HEADERS = [
  "일행번호",
  "일행인원",
  "일행내순번",
  "예약코드",
  "한글이름",
  "영문성",
  "영문이름",
  "주민번호앞",
  "주민번호뒷",
  "성별",
  "객실타입",
  "만나이",
  "생년월일",
  "여권번호",
  "여권생성일",
  "여권만료일",
  "고객연락처",
  "상품가",
  "변동금액",
  "비고1",
  "비고2",
];

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// 신규 passengers 가 없는 레거시 예약은 기존 필드로 1행 생성
function legacyPassenger(r: Reservation): Passenger {
  return {
    id: r.id,
    nameKo: r.name,
    roomType: r.room,
    passportNumber: r.passportNumber,
    passportExpiry: r.passportExpiry,
    phone: r.phone,
  };
}

/** 예약 목록 → CSV 문자열 (승객 1명 = 1행). Excel 한글 대응 BOM 포함. */
export function reservationsToCsv(reservations: Reservation[]): string {
  const rows: string[][] = [HEADERS];
  reservations.forEach((r, gi) => {
    const ps = r.passengers && r.passengers.length ? r.passengers : [legacyPassenger(r)];
    ps.forEach((p, pi) => {
      rows.push([
        String(gi + 1), // 일행번호 (같은 예약=같은 일행)
        String(ps.length), // 일행인원
        String(pi + 1), // 일행내순번
        r.code ?? "",
        p.nameKo ?? "",
        p.lastNameEn ?? "",
        p.firstNameEn ?? "",
        p.rrnFront ?? "",
        p.rrnBack ?? "",
        p.gender ?? "",
        p.roomType ?? "",
        koreanAge(p.birth),
        p.birth ?? "",
        p.passportNumber ?? "",
        p.passportIssue ?? "",
        p.passportExpiry ?? "",
        p.phone ?? "",
        p.productPrice != null ? String(p.productPrice) : "",
        p.adjustAmount != null ? String(p.adjustAmount) : "",
        p.note1 ?? "",
        p.note2 ?? "",
      ]);
    });
  });
  return "﻿" + rows.map((row) => row.map(esc).join(",")).join("\r\n");
}

/** 브라우저에서 CSV 다운로드 */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
