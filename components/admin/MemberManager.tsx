"use client";

import { useEffect, useState } from "react";
import { getMembers, deleteMember, type Member } from "@/lib/members";
import { useReservations } from "@/lib/useReservations";
import type { Reservation } from "@/lib/types";

// ms epoch → YYYY-MM-DD (로컬)
const fmtDateMs = (ms?: number) => {
  if (!ms) return "-";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const onlyDigits = (s?: string) => (s ?? "").replace(/\D/g, "");
// 가입일(ms) → 예약일(ISO) 사이 경과 일수
const daysAfter = (signupMs?: number, resIso?: string): number | null => {
  if (!signupMs || !resIso) return null;
  const b = new Date(resIso).getTime();
  if (isNaN(b)) return null;
  return Math.max(0, Math.floor((b - signupMs) / 86400000));
};

export default function MemberManager() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const { reservations } = useReservations();

  // 회원의 예약 이력 — 연락처(우선) 또는 이름으로 매칭 (일행 포함)
  const memberReservations = (m: Member): Reservation[] => {
    const mp = onlyDigits(m.phone);
    return reservations
      .filter((r) => {
        if (mp && (onlyDigits(r.phone) === mp || r.passengers?.some((p) => onlyDigits(p.phone) === mp))) return true;
        if (m.name && (r.name === m.name || r.passengers?.some((p) => p.nameKo === m.name))) return true;
        return false;
      })
      .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  };

  const load = async () => {
    setLoading(true);
    setMembers(await getMembers());
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const q = query.trim().toLowerCase();
  const shown = q
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          (m.phone ?? "").includes(q) ||
          (m.email ?? "").toLowerCase().includes(q),
      )
    : members;

  const remove = async (id: string, name: string) => {
    if (!confirm(`"${name}(${id})" 회원을 삭제할까요?`)) return;
    await deleteMember(id);
    setSelected(null);
    load();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">회원 관리</h1>
        <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">가입 회원을 조회하고 여권 정보를 확인·삭제할 수 있습니다 · 총 {members.length}명</p>
      </div>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 · 아이디 · 연락처 · 이메일 검색"
          className="w-full max-w-md rounded-lg border border-slate-200 px-4 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] outline-none focus:border-brand"
        />
      </div>

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          {members.length === 0 ? "가입한 회원이 없습니다." : "검색 결과가 없습니다."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-[min(0.9075vw,17.424px)] max-[991px]:whitespace-nowrap max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-semibold">아이디</th>
                <th className="px-4 py-3 font-semibold">이름</th>
                <th className="px-4 py-3 font-semibold">연락처</th>
                <th className="px-4 py-3 font-semibold">이메일</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">가입일</th>
                <th className="whitespace-nowrap px-4 py-3 text-center font-semibold">예약</th>
                <th className="px-4 py-3 text-center font-semibold">여권</th>
                <th className="px-4 py-3 text-center font-semibold">관리</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-slate-800">{m.id}</td>
                  <td className="px-4 py-3 text-slate-700">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-slate-600">{m.email ?? "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-slate-500">{fmtDateMs(m.createdAt)}</td>
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const cnt = memberReservations(m).length;
                      return cnt > 0 ? (
                        <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[0.85em] font-semibold text-sky-600">{cnt}건</span>
                      ) : (
                        <span className="text-[0.85em] text-slate-300">없음</span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {m.passportNumber || m.passportImage ? (
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[0.85em] font-semibold text-emerald-600">등록</span>
                    ) : (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.85em] font-semibold text-slate-400">미등록</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelected(m)}
                      className="mr-1 rounded-md border border-slate-300 px-3 py-1.5 text-[0.85em] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      상세
                    </button>
                    <button
                      onClick={() => remove(m.id, m.name)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-[0.85em] font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 모달 */}
      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-slate-800">{selected.name} <span className="text-[0.7em] font-normal text-slate-400">({selected.id})</span></h2>
              <button onClick={() => setSelected(null)} aria-label="닫기" className="text-[min(1.078vw,20.6976px)] max-[991px]:text-[min(3.3576vw,20.1456px)] max-[501px]:text-[4.0776vw] text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw]">
              <Row label="영문명" value={[selected.engLast, selected.engFirst].filter(Boolean).join(" ") || "-"} />
              <Row label="성별" value={selected.gender ?? "-"} />
              <Row label="생년월일" value={selected.birth ?? "-"} />
              <Row label="연락처" value={selected.phone ?? "-"} />
              <Row label="이메일" value={selected.email ?? "-"} full />
              <Row label="주소" value={[selected.zip, selected.addr1, selected.addr2].filter(Boolean).join(" ") || "-"} full />
              <Row label="이메일 수신" value={selected.emailConsent ? "동의" : "미동의"} />
              <Row label="SMS 수신" value={selected.smsConsent ? "동의" : "미동의"} />
              <Row label="여권번호" value={selected.passportNumber ?? "-"} />
              <Row label="여권만료" value={selected.passportExpiry ?? "-"} />
              <Row label="가입일" value={fmtDateMs(selected.createdAt)} full />
            </dl>

            {/* 여행 예약 이력 */}
            <div className="mt-5">
              <p className="mb-2 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-bold text-slate-700">
                여행 예약 이력 <span className="text-[0.85em] font-normal text-slate-400">{memberReservations(selected).length}건</span>
              </p>
              {memberReservations(selected).length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-4 py-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">예약 이력이 없습니다.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {memberReservations(selected).map((r) => {
                    const days = daysAfter(selected.createdAt, r.createdAt);
                    return (
                      <li key={r.id} className="rounded-lg border border-slate-200 px-4 py-3">
                        <p className="font-semibold text-slate-800">{r.voyageTitle}</p>
                        <p className="mt-0.5 text-[min(0.693vw,13.3056px)] max-[991px]:text-[min(2.1585vw,12.951px)] max-[501px]:text-[2.6213vw] text-slate-500">
                          출발 {r.departDate} · 예약일 {r.createdAt?.slice(0, 10) ?? "-"}
                          {days != null && <span className="ml-1 text-brand">(가입 {days}일 후 예약)</span>}
                          {r.code && <span className="ml-1 font-mono text-slate-400">· {r.code}</span>}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {selected.passportImage && (
              <div className="mt-4">
                <p className="mb-2 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">여권 이미지</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected.passportImage} alt="여권" className="w-full rounded-lg border border-slate-200" />
              </div>
            )}
            <button
              onClick={() => remove(selected.id, selected.name)}
              className="mt-5 w-full rounded-lg border border-red-200 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-red-500 transition hover:bg-red-50"
            >
              🗑 회원 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[min(0.6545vw,12.5664px)] max-[991px]:text-[min(2.0386vw,12.2316px)] max-[501px]:text-[2.4757vw] text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-700">{value}</dd>
    </div>
  );
}
