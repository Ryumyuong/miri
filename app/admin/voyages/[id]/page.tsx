"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useVoyages } from "@/lib/useVoyages";
import { useReservations } from "@/lib/useReservations";
import {
  aggregateForVoyage,
  expiresWithin6MonthsOfArrival,
  seedReservationsForVoyage,
  updateReservation,
  addReservation,
  deleteReservation,
} from "@/lib/reservations";
import { reservationsToCsv, downloadCsv } from "@/lib/csv";
import { buildContractMessage, sendContractSms } from "@/lib/sms";
import { useState } from "react";
import type { Reservation, Passenger } from "@/lib/types";
import PassengerEditor from "@/components/admin/PassengerEditor";

export default function VoyagePassengersPage() {
  const params = useParams();
  const id = String(params.id);
  const { voyages, loading } = useVoyages();
  const { reservations, loading: rLoading } = useReservations();
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null); // 계약서 발송 중인 예약 id
  const [selected, setSelected] = useState<Set<string>>(new Set()); // 계약서 발송 대상 체크
  const [creating, setCreating] = useState(false); // 신규 승객 추가(편집창) 여부 — 저장 시에만 생성
  const [statusOpen, setStatusOpen] = useState(false); // 예약현황 팝업
  const [roomingOpen, setRoomingOpen] = useState(false); // 루밍리스트 팝업
  const v = voyages.find((x) => x.id === id);

  if (loading || rLoading) {
    return <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>;
  }
  if (!v) {
    return (
      <div className="py-16 text-center">
        <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">일정을 찾을 수 없습니다.</p>
        <Link href="/admin/voyages" className="mt-3 inline-block text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-brand hover:underline">
          ← 운항 일정 목록
        </Link>
      </div>
    );
  }

  // 승객 명단은 등록 순(오래된 → 최신)으로 정렬 → 새로 추가한 승객이 맨 뒤에 표시
  const passengers = reservations
    .filter((r) => r.voyageId === v.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const agg = aggregateForVoyage(reservations, v.id);

  // 예약(팀)의 일행 전원을 개별 행으로 펼치기 — passengers 없으면 대표 1명으로 구성
  const membersOf = (r: Reservation): Passenger[] =>
    r.passengers?.length
      ? r.passengers
      : [{ id: r.id, nameKo: r.name, phone: r.phone, roomType: r.room, passportNumber: r.passportNumber, passportExpiry: r.passportExpiry }];

  // 요약 지표 — 팀이 아니라 총 인원(일행 포함) 기준으로 집계
  const allMembers = passengers.flatMap((r) => membersOf(r).map((m) => ({ m, r })));
  const totalPax = allMembers.length;
  const passportDonePax = allMembers.filter(({ m }) => !!m.passportExpiry).length;
  const passportPendingPax = totalPax - passportDonePax;
  const contractPaidPax = allMembers.filter(({ r }) => r.contractPaid).length;

  // 예약현황 — 예약코드로 묶어(정렬) 일행 전원을 나열, 팀 내 순번(seq) 부여
  const engName = (m: Passenger) => [m.lastNameEn, m.firstNameEn].filter(Boolean).join(" ");
  const ageAt = (birth?: string) => {
    if (!birth || !v.departDate) return null;
    const b = new Date(birth + "T00:00:00");
    const d = new Date(v.departDate + "T00:00:00");
    if (isNaN(b.getTime()) || isNaN(d.getTime())) return null;
    let a = d.getFullYear() - b.getFullYear();
    const mm = d.getMonth() - b.getMonth();
    if (mm < 0 || (mm === 0 && d.getDate() < b.getDate())) a--;
    return a;
  };
  const ageGroup = (age: number | null) => (age == null ? "-" : age >= 12 ? "성인" : age >= 2 ? "아동" : "유아");

  // 루밍리스트 — 객실타입별 그룹(일행 전원)
  const ROOM_ORDER = ["내측", "오션뷰", "발코니", "스위트"];
  const roomOf = (m: Passenger, r: Reservation) => m.roomType || r.room || "미지정";
  const roomingGroups = Array.from(new Set(allMembers.map(({ m, r }) => roomOf(m, r))))
    .sort((a, b) => (ROOM_ORDER.indexOf(a) + 1 || 99) - (ROOM_ORDER.indexOf(b) + 1 || 99))
    .map((room) => ({ room, members: allMembers.filter(({ m, r }) => roomOf(m, r) === room) }));

  const bookingRows = [...passengers]
    .sort((a, b) => (a.code ?? "").localeCompare(b.code ?? "") || a.createdAt.localeCompare(b.createdAt))
    .flatMap((r) => membersOf(r).map((m, i) => ({ r, m, seq: i + 1 })));
  const adultCnt = bookingRows.filter((x) => ageGroup(ageAt(x.m.birth)) === "성인").length;

  // 예약현황 인쇄
  const printStatus = () => {
    const rows = bookingRows
      .map(
        (x) =>
          `<tr><td>${esc(x.r.code ?? "-")}</td><td>${x.seq}</td><td>${esc(x.m.nameKo ?? "-")}</td><td>${esc(engName(x.m) || "-")}</td><td>${esc(x.m.gender ?? "-")}</td><td>${ageGroup(ageAt(x.m.birth))}</td><td>${esc(x.m.roomType || x.r.room || "-")}</td><td>${esc(x.m.rooming || "-")}</td><td>${x.m.passportExpiry ? "완료" : "미제출"}</td><td>${x.r.contractPaid ? "완료" : "대기"}</td></tr>`,
      )
      .join("");
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>예약현황 - ${esc(v.title)}</title>
      <style>
        body{font-family:Pretendard,system-ui,"Malgun Gothic",sans-serif;color:#1e293b;padding:32px;}
        h1{font-size:20px;margin:0 0 4px;color:#113667;}
        .meta{font-size:12px;color:#64748b;margin-bottom:16px;}
        table{width:100%;border-collapse:collapse;font-size:12.5px;}
        th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:center;}
        th{background:#f1f5f9;color:#475569;font-weight:600;}
        @media print{body{padding:0;}}
      </style></head><body>
        <h1>예약현황</h1>
        <div class="meta">상품코드 ${esc(v.code ?? "-")} · ${esc(v.title)} · 총 ${totalPax}명(${passengers.length}팀) · 성인 ${adultCnt}명</div>
        <table><thead><tr><th>예약코드</th><th>순번</th><th>성명</th><th>영문성명</th><th>성별</th><th>나이구분</th><th>객실</th><th>루밍</th><th>여권</th><th>계약금</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;
    const w = window.open("", "_blank", "width=1000,height=720");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const esc = (s: string) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));

  // 루밍리스트 인쇄 (객실 타입별 그룹, 일행 전원 표시 + 루밍 배정)
  const printRooming = () => {
    const sections = roomingGroups
      .map(({ room, members }) => {
        const rows = members
          .map(
            ({ m, r }, i) =>
              `<tr><td>${i + 1}</td><td>${esc(m.nameKo || r.name)}</td><td>${esc(m.phone || r.phone || "-")}</td><td>${esc(m.rooming || "-")}</td><td>${esc(r.code ?? "-")}</td><td>${esc(m.passportNumber ?? "-")}</td><td>${esc(m.passportExpiry ?? "-")}</td></tr>`,
          )
          .join("");
        return `<h2>${esc(room)} <span class="cnt">(${members.length}명)</span></h2>
          <table><thead><tr><th>No</th><th>이름</th><th>연락처</th><th>루밍</th><th>예약코드</th><th>여권번호</th><th>여권 만료일</th></tr></thead><tbody>${rows}</tbody></table>`;
      })
      .join("");

    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>루밍리스트 - ${esc(v.title)}</title>
      <style>
        body{font-family:Pretendard,system-ui,"Malgun Gothic",sans-serif;color:#1e293b;padding:32px;}
        h1{font-size:20px;margin:0 0 4px;color:#113667;}
        .meta{font-size:12px;color:#64748b;margin-bottom:20px;}
        h2{font-size:15px;margin:22px 0 8px;color:#113667;}
        .cnt{font-size:12px;color:#94a3b8;font-weight:400;}
        table{width:100%;border-collapse:collapse;font-size:13px;}
        th,td{border:1px solid #e2e8f0;padding:7px 10px;text-align:left;}
        th{background:#f1f5f9;color:#475569;font-weight:600;}
        @media print{body{padding:0;}}
      </style></head><body>
        <h1>루밍리스트</h1>
        <div class="meta">${esc(v.title)} · 출항 ${esc(v.departDate)} ~ 귀항 ${esc(v.arriveDate)} · ${esc(v.shipName)} · 총 ${totalPax}명(${passengers.length}팀)</div>
        ${sections}
      </body></html>`;
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  // 예약자(승객) 명단 CSV 다운로드 — 예약코드/한글·영문이름/주민번호/성별/만나이/여권/상품가/변동금액/비고 등
  const exportCsv = () => {
    downloadCsv(`${v.code ?? v.title}_예약자명단.csv`, reservationsToCsv(passengers));
  };

  // 여행자계약서 문자 발송 — 예약코드(승객)별 개별 발송 (실제 문자 연동은 추후, 지금은 '발송됨' 표기 기록)
  const sentCount = passengers.filter((p) => p.contractSentAt).length;
  const sendOne = async (p: Reservation) => {
    const resend = !!p.contractSentAt;
    if (!confirm(`${p.name}님 (예약코드 ${p.code ?? "-"})에게 여행자계약서 문자를 ${resend ? "재발송" : "발송"}할까요?`)) return;
    setSendingId(p.id);
    try {
      const msg = buildContractMessage({ name: p.name, voyageTitle: v.title, code: p.code });
      await sendContractSms(p.phone, msg); // 게이트웨이 미연동 시 /api/sms 가 no-op(ok)
      await updateReservation(p.id, { contractSentAt: new Date().toISOString() });
    } finally {
      setSendingId(null);
    }
  };

  // 체크박스 선택 토글 / 전체선택
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allChecked = passengers.length > 0 && passengers.every((p) => selected.has(p.id));
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(passengers.map((p) => p.id)));

  // 체크한 대상에게 계약서 일괄 발송
  const sendSelected = async () => {
    const targets = passengers.filter((p) => selected.has(p.id));
    if (targets.length === 0) return;
    if (!confirm(`선택한 ${targets.length}명(팀)에게 여행자계약서 문자를 발송할까요?`)) return;
    const now = new Date().toISOString();
    for (const p of targets) {
      const msg = buildContractMessage({ name: p.name, voyageTitle: v.title, code: p.code });
      await sendContractSms(p.phone, msg);
      await updateReservation(p.id, { contractSentAt: now });
    }
    setSelected(new Set());
  };

  // 관리자가 승객 추가 — 편집창만 열고, '저장' 눌러야 실제 생성 (취소 시 아무것도 안 남음)
  const addPassenger = () => {
    setCreating(true);
    setEditing({
      id: "", voyageId: v.id, voyageTitle: v.title, departDate: v.departDate, arriveDate: v.arriveDate,
      name: "", phone: "", room: "내측", headcount: 1, contractPaid: false, createdAt: "",
    });
  };
  // 신규 승객 저장 = 예약 생성 (첫 승객 기준으로 대표 정보 채움)
  const createReservation = async (passengers: Passenger[]) => {
    const first = passengers[0];
    await addReservation({
      voyageId: v.id, voyageTitle: v.title, departDate: v.departDate, arriveDate: v.arriveDate,
      name: first?.nameKo || "신규 승객", phone: first?.phone || "", room: first?.roomType || "내측",
      headcount: passengers.length, contractPaid: false, passengers,
    });
  };

  // 승객(예약) 삭제
  const removeReservation = async (p: Reservation) => {
    if (!confirm(`${p.name || "이 승객"} (예약코드 ${p.code ?? "-"}) 예약을 삭제할까요?\n일행 ${p.passengers?.length ?? p.headcount ?? 1}명이 함께 삭제됩니다.`)) return;
    await deleteReservation(p.id);
    setSelected((s) => { const n = new Set(s); n.delete(p.id); return n; });
  };

  return (
    <div>
      <Link href="/admin/voyages" className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500 hover:text-slate-800">
        ← 운항 일정 목록
      </Link>

      <h1 className="mt-3 flex flex-wrap items-center gap-2 text-[min(1.375vw,26.4px)] font-bold text-slate-800 max-[991px]:text-[min(3.2377vw,19.4262px)] max-[501px]:text-[3.932vw]">
        {v.title}
        {v.published === false && (
          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[0.6em] font-semibold text-amber-700">임시저장</span>
        )}
      </h1>
      <p className="mt-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-400">
        상품코드 <span className="text-[#1E4D8B]">{v.code ?? "미지정"}</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-500">
        <span>📅 출항: {v.departDate}</span>
        <span>📅 귀항: {v.arriveDate}</span>
        <span>🚢 {v.shipName}</span>
        <span>👥 {agg.pax}명 예약 ({agg.reservedCount}팀)</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Summary label="여권 완료" value={`${passportDonePax}/${totalPax}`} color="emerald" />
        <Summary label="미제출" value={`${passportPendingPax}명`} color="orange" />
        <Summary label="계약금 완료" value={`${contractPaidPax}/${totalPax}`} color="sky" />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3 max-[991px]:flex-col max-[991px]:items-start">
          <h2 className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-slate-700">승객 명단</h2>
          {/* 모바일: 6개 항목을 3열 그리드로 각 1/3 폭 차지 */}
          <div className="flex flex-wrap items-center gap-2 max-[991px]:grid max-[991px]:w-full max-[991px]:grid-cols-3 max-[991px]:[&>*]:flex max-[991px]:[&>*]:items-center max-[991px]:[&>*]:justify-center">
            <span className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">총 {passengers.length}팀</span>
            <button
              onClick={addPassenger}
              className="rounded-md bg-navy px-2.5 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-white hover:bg-navy-dark"
            >
              + 승객 추가
            </button>
            {passengers.length > 0 && (
              <>
                {selected.size > 0 && (
                  <button
                    onClick={sendSelected}
                    className="rounded-md bg-[#1E4D8B] px-2.5 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-white hover:brightness-110"
                  >
                    ✉ 선택 발송 ({selected.size})
                  </button>
                )}
                <button
                  onClick={() => setRoomingOpen(true)}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  🖨 루밍리스트
                </button>
                <button
                  onClick={exportCsv}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  ⬇ 명단 CSV
                </button>
                <button
                  onClick={() => setStatusOpen(true)}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  📋 예약현황
                </button>
                <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 text-[min(0.825vw,15.84px)] max-[991px]:px-1 max-[991px]:text-[min(2.15vw,12.9px)] max-[501px]:text-[2.6vw] font-semibold text-emerald-700">
                  계약서 발송 {sentCount}/{passengers.length}
                </span>
              </>
            )}
          </div>
        </div>
        {passengers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">아직 가예약 신청이 없습니다.</p>
            <button
              onClick={() => seedReservationsForVoyage(v)}
              className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-600 hover:bg-slate-50"
            >
              샘플 승객 불러오기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-[1.0714em] text-slate-400">
                  <th className="px-2 py-2 text-center font-medium" title="계약서 발송 대상 선택">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[#1E4D8B]" aria-label="전체 선택" />
                  </th>
                  <th className="px-2 py-2 text-left font-medium">No</th>
                  <th className="px-2 py-2 text-left font-medium">이름</th>
                  <th className="px-2 py-2 text-left font-medium">연락처</th>
                  <th className="px-2 py-2 text-left font-medium">객실</th>
                  <th className="px-2 py-2 text-left font-medium">여권</th>
                  <th className="px-2 py-2 text-left font-medium">여권 만료</th>
                  <th className="px-2 py-2 text-left font-medium">계약금</th>
                  <th className="px-2 py-2 text-left font-medium">예약코드</th>
                  <th className="px-2 py-2 text-left font-medium">계약서</th>
                  <th className="px-2 py-2 text-left font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let no = 0;
                  return passengers.map((p) => {
                    const members = membersOf(p);
                    const sel = selected.has(p.id);
                    const rowBg = sel ? "bg-[#1E4D8B]/5" : "";
                    return members.map((m, mi) => {
                      no++;
                      const done = !!m.passportExpiry;
                      const expiringSoon = done && expiresWithin6MonthsOfArrival(m.passportExpiry!, p.arriveDate);
                      const isLast = mi === members.length - 1;
                      return (
                        <tr key={`${p.id}-${mi}`} className={`${rowBg} ${isLast ? "border-b-2 border-slate-100" : "border-b border-slate-50"}`}>
                          {mi === 0 && (
                            <td rowSpan={members.length} className="px-2 py-2 text-center align-top">
                              <input type="checkbox" checked={sel} onChange={() => toggle(p.id)} className="accent-[#1E4D8B]" aria-label={`${p.name} 팀 선택`} />
                            </td>
                          )}
                          <td className="px-2 py-2 text-slate-400">{no}</td>
                          <td className="whitespace-nowrap px-2 py-2 font-medium text-slate-700">
                            {m.nameKo || "—"}
                            <span className={`ml-1.5 rounded px-1 py-0.5 text-[0.7em] font-semibold ${mi === 0 ? "bg-navy/10 text-navy" : "bg-slate-100 text-slate-400"}`}>
                              {mi === 0 ? "대표" : "일행"}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-slate-500">{m.phone || "—"}</td>
                          <td className="whitespace-nowrap px-2 py-2 text-slate-500">{m.roomType || p.room || "—"}</td>
                          <td className="px-2 py-2">
                            <Tag ok={done} okText="완료" noText="미제출" />
                          </td>
                          <td className="whitespace-nowrap px-2 py-2 text-slate-500">
                            {m.passportExpiry ? (
                              <span className={expiringSoon ? "font-semibold text-red-500" : ""}>
                                {m.passportExpiry}
                                {expiringSoon && " ⚠"}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          {mi === 0 && (
                            <>
                              <td rowSpan={members.length} className="px-2 py-2 align-top">
                                <Tag ok={p.contractPaid} okText="완료" noText="대기" />
                              </td>
                              <td rowSpan={members.length} className="whitespace-nowrap px-2 py-2 align-top">
                                <span className="font-mono text-[1.0714em] text-slate-500">{p.code ?? "—"}</span>
                              </td>
                              <td rowSpan={members.length} className="px-2 py-2 align-top">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => sendOne(p)}
                                    disabled={sendingId === p.id}
                                    className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[1.0714em] font-semibold disabled:opacity-50 ${
                                      p.contractSentAt
                                        ? "border border-slate-300 text-slate-600 hover:bg-slate-50"
                                        : "bg-[#1E4D8B] text-white hover:brightness-110"
                                    }`}
                                  >
                                    {sendingId === p.id ? "발송 중…" : p.contractSentAt ? "재발송" : "✉ 발송"}
                                  </button>
                                  {p.contractSentAt && (
                                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[0.7143em] font-semibold text-emerald-700">발송됨</span>
                                  )}
                                </div>
                              </td>
                              <td rowSpan={members.length} className="px-2 py-2 align-top">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setEditing(p)}
                                    className="whitespace-nowrap rounded-md border border-slate-300 px-2.5 py-1 text-[1.0714em] font-semibold text-slate-600 hover:bg-slate-50"
                                  >
                                    승객정보
                                  </button>
                                  <button
                                    onClick={() => removeReservation(p)}
                                    className="rounded-md border border-red-200 px-2 py-1 text-[1.0714em] font-semibold text-red-500 hover:bg-red-50"
                                    title="예약 삭제"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    });
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <PassengerEditor
          reservation={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={creating ? createReservation : undefined}
        />
      )}

      {statusOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setStatusOpen(false)}>
          <div className="w-full max-w-[1000px] overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* 헤더 바 */}
            <div className="flex items-center justify-between bg-slate-700 px-5 py-3 text-white">
              <h3 className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold">예약현황</h3>
              <div className="flex items-center gap-2">
                <button onClick={printStatus} className="rounded bg-white/15 px-2.5 py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold hover:bg-white/25">🖨 인쇄</button>
                <button onClick={() => setStatusOpen(false)} className="text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] leading-none hover:opacity-80">✕</button>
              </div>
            </div>

            {/* 요약 */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 border-b border-slate-100 px-5 py-4 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] max-[501px]:grid-cols-1">
              <p className="flex gap-2"><span className="w-20 shrink-0 text-slate-400">상품코드</span><span className="font-semibold text-navy">{v.code ?? "미지정"}</span></p>
              <p className="flex gap-2"><span className="w-20 shrink-0 text-slate-400">상품명</span><span className="min-w-0 truncate font-medium text-slate-700">{v.title}</span></p>
              <p className="flex gap-2"><span className="w-20 shrink-0 text-slate-400">예약인원</span><span className="font-medium text-slate-700">총 {totalPax}명 ({passengers.length}팀) · 성인 {adultCnt}명</span></p>
              <p className="flex gap-2"><span className="w-20 shrink-0 text-slate-400">여권/계약금</span><span className="font-medium text-slate-700">여권 {passportDonePax}/{totalPax} · 계약금 {contractPaidPax}/{totalPax}</span></p>
            </div>

            {/* 표 — 예약코드로 묶어 정렬, 일행 전원 상태 표시 */}
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
                <thead className="sticky top-0 bg-slate-50 text-slate-400">
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-2 text-left font-medium">예약코드</th>
                    <th className="px-3 py-2 text-center font-medium">순번</th>
                    <th className="px-3 py-2 text-left font-medium">성명</th>
                    <th className="px-3 py-2 text-left font-medium">영문성명</th>
                    <th className="px-3 py-2 text-center font-medium">성별</th>
                    <th className="px-3 py-2 text-center font-medium">나이구분</th>
                    <th className="px-3 py-2 text-left font-medium">객실</th>
                    <th className="px-3 py-2 text-left font-medium">루밍</th>
                    <th className="px-3 py-2 text-center font-medium">여권</th>
                    <th className="px-3 py-2 text-center font-medium">계약금</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingRows.map((x, idx) => {
                    const first = idx === 0 || bookingRows[idx - 1].r.id !== x.r.id;
                    return (
                      <tr key={`${x.r.id}-${x.seq}`} className={`border-b border-slate-50 ${first ? "border-t-2 border-t-slate-100" : ""}`}>
                        <td className="px-3 py-2 font-mono text-slate-500">{first ? (x.r.code ?? "—") : ""}</td>
                        <td className="px-3 py-2 text-center text-slate-400">{x.seq}</td>
                        <td className="px-3 py-2 font-medium text-slate-700">{x.m.nameKo || "—"}</td>
                        <td className="px-3 py-2 text-slate-500">{engName(x.m) || "—"}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{x.m.gender || "—"}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{ageGroup(ageAt(x.m.birth))}</td>
                        <td className="px-3 py-2 text-slate-500">{x.m.roomType || x.r.room || "—"}</td>
                        <td className="px-3 py-2 text-slate-500">{x.m.rooming || "—"}</td>
                        <td className="px-3 py-2 text-center"><Tag ok={!!x.m.passportExpiry} okText="완료" noText="미제출" /></td>
                        <td className="px-3 py-2 text-center"><Tag ok={x.r.contractPaid} okText="완료" noText="대기" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {bookingRows.length === 0 && (
                <p className="py-10 text-center text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.2039vw] text-slate-400">예약 인원이 없습니다.</p>
              )}
            </div>

            <p className="border-t border-slate-100 px-5 py-3 text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] text-slate-400">
              ※ 예약코드가 같은 행은 일행(같은 예약)입니다. 예약코드 순으로 묶어 정렬됩니다.
            </p>
          </div>
        </div>
      )}

      {roomingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setRoomingOpen(false)}>
          <div className="w-full max-w-[900px] overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between bg-slate-700 px-5 py-3 text-white">
              <h3 className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold">루밍리스트</h3>
              <div className="flex items-center gap-2">
                <button onClick={printRooming} className="rounded bg-white/15 px-2.5 py-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold hover:bg-white/25">🖨 인쇄</button>
                <button onClick={() => setRoomingOpen(false)} className="text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] leading-none hover:opacity-80">✕</button>
              </div>
            </div>

            <div className="border-b border-slate-100 px-5 py-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-500">
              {v.title} · 출항 {v.departDate} ~ 귀항 {v.arriveDate} · {v.shipName} · 총 {totalPax}명({passengers.length}팀)
            </div>

            <div className="max-h-[60vh] space-y-5 overflow-auto px-5 py-4">
              {roomingGroups.length === 0 ? (
                <p className="py-10 text-center text-[min(0.847vw,16.2624px)] max-[991px]:text-[min(2.6381vw,15.8286px)] max-[501px]:text-[3.2039vw] text-slate-400">예약 인원이 없습니다.</p>
              ) : (
                roomingGroups.map(({ room, members }) => (
                  <div key={room}>
                    <h4 className="mb-2 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-bold text-navy">
                      {room} <span className="text-[0.85em] font-normal text-slate-400">({members.length}명)</span>
                    </h4>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-400">
                          <tr className="border-b border-slate-100">
                            <th className="px-3 py-2 text-center font-medium">No</th>
                            <th className="px-3 py-2 text-left font-medium">이름</th>
                            <th className="px-3 py-2 text-left font-medium">연락처</th>
                            <th className="px-3 py-2 text-left font-medium">루밍</th>
                            <th className="px-3 py-2 text-left font-medium">예약코드</th>
                            <th className="px-3 py-2 text-left font-medium">여권번호</th>
                            <th className="px-3 py-2 text-left font-medium">여권 만료일</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map(({ m, r }, i) => (
                            <tr key={`${r.id}-${i}`} className="border-b border-slate-50 last:border-0">
                              <td className="px-3 py-2 text-center text-slate-400">{i + 1}</td>
                              <td className="px-3 py-2 font-medium text-slate-700">{m.nameKo || r.name}</td>
                              <td className="px-3 py-2 text-slate-500">{m.phone || r.phone || "—"}</td>
                              <td className="px-3 py-2 text-slate-500">{m.rooming || "—"}</td>
                              <td className="px-3 py-2 font-mono text-slate-500">{r.code ?? "—"}</td>
                              <td className="px-3 py-2 text-slate-500">{m.passportNumber || "—"}</td>
                              <td className="px-3 py-2 text-slate-500">{m.passportExpiry || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>

            <p className="border-t border-slate-100 px-5 py-3 text-[min(0.715vw,13.728px)] max-[991px]:text-[min(2.2271vw,13.3626px)] max-[501px]:text-[2.7046vw] text-slate-400">
              ※ 루밍(객실 배정)은 승객정보에서 입력할 수 있습니다. 객실타입별로 그룹화됩니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const summaryColor: Record<string, string> = {
  emerald: "text-emerald-600",
  orange: "text-orange-600",
  sky: "text-sky-600",
};

function Summary({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{label}</p>
      <p className={`mt-1 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold ${summaryColor[color]}`}>{value}</p>
    </div>
  );
}

function Tag({ ok, okText, noText }: { ok: boolean; okText: string; noText: string }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-medium ${ok ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
      {ok ? okText : noText}
    </span>
  );
}
