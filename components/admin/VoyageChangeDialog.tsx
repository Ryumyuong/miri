"use client";

import { useState } from "react";
import type { Reservation, Voyage } from "@/lib/types";
import { bookedPaxFor, changeReservationVoyage, paxOf, registeredPrice } from "@/lib/reservations";
import { remainingSeats } from "@/lib/voyages";
import { siblingsOf } from "@/lib/voyage-group";
import { activeMembers } from "@/lib/reservation-state";

const won = (n?: number) => (n ? `${n.toLocaleString("ko-KR")}원` : "-");

/** 예약 일정 변경 — 같은 상품의 다른 출발일을 먼저 보여주고, 다른 상품으로도 이동 가능 */
export default function VoyageChangeDialog({
  reservation,
  voyage,
  voyages,
  reservations,
  onClose,
}: {
  reservation: Reservation;
  voyage: Voyage;
  voyages: Voyage[];
  reservations: Reservation[];
  onClose: () => void;
}) {
  const [targetId, setTargetId] = useState("");
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const match = (x: Voyage) => {
    const s = q.trim().toLowerCase();
    return !s || [x.title, x.code, x.shipName, x.region, x.departDate].some((t) => t?.toLowerCase().includes(s));
  };
  const sameIds = new Set(siblingsOf(voyages, voyage).map((x) => x.id));
  const sameOptions = siblingsOf(voyages, voyage).filter((x) => x.id !== voyage.id && match(x));
  const otherOptions = voyages
    .filter((x) => !sameIds.has(x.id) && match(x))
    .sort((a, b) => a.departDate.localeCompare(b.departDate));
  const target = voyages.find((x) => x.id === targetId && x.id !== voyage.id);
  const otherProduct = !!target && !sameIds.has(target.id);

  const renderOption = (o: Voyage) => {
    const left = remainingSeats(o, bookedPaxFor(reservations, o.id));
    const short = pax > left;
    return (
      <label
        key={o.id}
        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${targetId === o.id ? "border-[#1E4D8B] bg-[#1E4D8B]/5" : "border-slate-200 hover:bg-slate-50"}`}
      >
        <input type="radio" name="target" checked={targetId === o.id} onChange={() => setTargetId(o.id)} className="mt-1 accent-[#1E4D8B]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-700">
            {o.departDate} ~ {o.arriveDate}
            {o.published === false && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">임시저장</span>}
            {o.hidden && <span className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">숨김</span>}
          </p>
          <p className="truncate text-xs text-slate-400">{o.code ?? "코드 미지정"} · {o.title}</p>
          <p className={`mt-0.5 text-xs ${short ? "font-semibold text-red-500" : "text-slate-500"}`}>
            잔여 {left}명 / 정원 {o.capacity ?? 30}명{short && " · 잔여석 부족"}
          </p>
        </div>
      </label>
    );
  };
  const pax = paxOf(reservation);
  const members = activeMembers(reservation);
  // 승객별 객실타입 기준 요금 비교 (대표 객실타입 기준으로 묶어 표시)
  const roomTypes = Array.from(new Set(members.map((m) => m.roomType || reservation.room).filter(Boolean)));

  const submit = async () => {
    if (!target) return;
    const left = remainingSeats(target, bookedPaxFor(reservations, target.id));
    const seatWarn = pax > left ? `\n\n⚠ 변경할 일정의 잔여석(${left}명)보다 인원(${pax}명)이 많습니다.` : "";
    const productLine = otherProduct ? `\n상품 변경: ${voyage.title}\n → ${target.title}` : "";
    if (!confirm(`${reservation.name || "이 예약"} (예약코드 ${reservation.code ?? "-"}, ${pax}명)\n출발일 ${voyage.departDate} → ${target.departDate} 로 변경할까요?${productLine}${seatWarn}`)) return;
    setSaving(true);
    try {
      await changeReservationVoyage(reservation, voyage, target);
      alert(`${target.departDate} 출발 일정으로 변경했습니다.`);
      onClose();
    } catch (e) {
      alert("변경하지 못했습니다." + (e instanceof Error && e.message ? "\n\n" + e.message : ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      {/* 헤더·버튼은 고정, 일정 목록만 스크롤 */}
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">예약 일정 변경</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              예약코드 <span className="font-semibold text-[#1E4D8B]">{reservation.code ?? "-"}</span> · {reservation.name || "-"} · {pax}명
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              현재 출발일 <span className="font-semibold text-slate-600">{voyage.departDate}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6 py-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="상품명·상품코드·선박·출발일 검색"
            className="mb-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1E4D8B] focus:bg-white"
          />
          <p className="pt-1 text-xs font-bold text-slate-500">같은 상품 다른 출발일</p>
          {sameOptions.length === 0 ? (
            <p className="py-2 text-xs text-slate-400">같은 상품의 다른 출발일이 없습니다.</p>
          ) : (
            sameOptions.map(renderOption)
          )}
          <p className="pt-3 text-xs font-bold text-slate-500">다른 상품</p>
          {otherOptions.length === 0 ? (
            <p className="py-2 text-xs text-slate-400">해당하는 상품이 없습니다.</p>
          ) : (
            otherOptions.map(renderOption)
          )}
        </div>

        {/* 선택한 일정의 요금 비교 — 버튼 바로 위에 고정 */}
        {target && roomTypes.length > 0 && (
          <div className="shrink-0 border-t border-slate-100 px-6 pt-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="mb-1.5 font-bold text-slate-700">등록 요금 비교</p>
              {roomTypes.map((rt) => {
                const a = registeredPrice(voyage, rt);
                const b = registeredPrice(target, rt);
                return (
                  <p key={rt}>
                    {rt}: {won(a)} → <span className={a !== b ? "font-semibold text-[#1E4D8B]" : ""}>{won(b)}</span>
                  </p>
                );
              })}
              <p className="mt-1.5 text-slate-400">상품가가 등록 요금 그대로인 승객은 새 요금으로 바뀌고, 직접 수정한 금액은 유지됩니다.</p>
              {otherProduct && (
                <p className="mt-1.5 font-semibold text-orange-600">다른 상품으로 이동합니다. 직접 수정한 상품가·객실타입은 이동 후 승객정보에서 확인해 주세요.</p>
              )}
            </div>
          </div>
        )}

        <div className={`flex shrink-0 items-center justify-end gap-2 px-6 py-4 ${target && roomTypes.length > 0 ? "" : "border-t border-slate-100"}`}>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50">
            닫기
          </button>
          <button
            onClick={submit}
            disabled={!target || saving}
            className="rounded-lg bg-[#1E4D8B] px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
          >
            {saving ? "변경 중…" : "일정 변경"}
          </button>
        </div>
      </div>
    </div>
  );
}
