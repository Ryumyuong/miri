"use client";

import { useState } from "react";
import { useVoyages } from "@/lib/useVoyages";
import { updateVoyage } from "@/lib/voyages";
import type { Voyage } from "@/lib/types";
import Pagination from "@/components/admin/Pagination";

/** 프라임 상품 관리 — 프라임 노출 상품 지정 및 노출 순서 조정 */
export default function PrimeManager() {
  const { voyages, loading } = useVoyages();
  const [q, setQ] = useState("");
  const OTHERS_PAGE_SIZE = 10;
  const [othersPage, setOthersPage] = useState(1);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = voyages.filter((v) => v.departDate >= today);

  const primes = upcoming
    .filter((v) => v.isPrime)
    .sort((a, b) => (a.primeOrder ?? 999) - (b.primeOrder ?? 999) || a.departDate.localeCompare(b.departDate));
  const others = upcoming
    .filter((v) => !v.isPrime)
    .filter((v) => {
      const s = q.trim().toLowerCase();
      return !s || v.title.toLowerCase().includes(s) || v.region.toLowerCase().includes(s);
    })
    .sort((a, b) => a.departDate.localeCompare(b.departDate));
  const pagedOthers = others.slice((othersPage - 1) * OTHERS_PAGE_SIZE, othersPage * OTHERS_PAGE_SIZE);

  const addPrime = async (v: Voyage) => {
    const maxOrder = primes.reduce((m, p) => Math.max(m, p.primeOrder ?? 0), 0);
    await updateVoyage(v.id, { isPrime: true, primeOrder: maxOrder + 1 });
  };
  const removePrime = async (v: Voyage) => {
    await updateVoyage(v.id, { isPrime: false });
  };
  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= primes.length) return;
    const arr = [...primes];
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    // 순서를 0..n 으로 정규화하며 변경분만 저장
    await Promise.all(arr.map((v, i) => (v.primeOrder !== i ? updateVoyage(v.id, { primeOrder: i }) : null)));
  };

  return (
    <div>
      <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">프라임 상품 관리</h1>
      <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">프라임 페이지에 단독 노출할 상품을 지정하고 노출 순서를 조정합니다.</p>

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>
      ) : (
        <>
          {/* 프라임 노출 상품 */}
          <h2 className="mb-3 mt-8 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-700">
            프라임 노출 상품 <span className="text-[1em] font-normal text-slate-400">{primes.length}개</span>
          </h2>
          {primes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
              지정된 프라임 상품이 없습니다. 아래에서 상품을 추가하세요.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {primes.map((v, i) => (
                <div key={v.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#1E4D8B]/25 bg-[#1E4D8B]/[0.03] p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#1E4D8B] text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-bold text-white">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-700">{v.title}</p>
                      <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{v.region} · 출항 {v.departDate}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30" aria-label="위로">▲</button>
                    <button onClick={() => move(i, 1)} disabled={i === primes.length - 1} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30" aria-label="아래로">▼</button>
                    <button onClick={() => removePrime(v)} className="ml-1 rounded-md border border-red-200 px-3 py-1.5 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-red-500 hover:bg-red-50">프라임 해제</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 프라임 추가 가능 상품 */}
          <div className="mb-3 mt-10 flex items-center justify-between gap-3 max-[991px]:flex-col max-[991px]:items-start">
            <h2 className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-700">
              프라임 추가 가능 상품 <span className="text-[1em] font-normal text-slate-400">{others.length}개</span>
            </h2>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOthersPage(1);
              }}
              placeholder="상품명·권역 검색"
              className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] outline-none focus:border-brand max-[991px]:max-w-none"
            />
          </div>
          {others.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
              추가 가능한 상품이 없습니다.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {pagedOthers.map((v) => (
                  <div key={v.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="min-w-0">
                      <p className="truncate text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-700">{v.title}</p>
                      <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">{v.region} · 출항 {v.departDate}</p>
                    </div>
                    <button onClick={() => addPrime(v)} className="shrink-0 rounded-lg bg-[#1E4D8B] px-4 py-2 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-semibold text-white hover:brightness-110">
                      + 프라임 지정
                    </button>
                  </div>
                ))}
              </div>
              <Pagination total={others.length} pageSize={OTHERS_PAGE_SIZE} page={othersPage} onPage={setOthersPage} />
            </>
          )}
        </>
      )}
    </div>
  );
}
