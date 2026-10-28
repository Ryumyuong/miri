"use client";

import { useEffect, useState } from "react";
import { usePorts } from "@/lib/usePorts";
import PortImages from "@/components/site/PortImages";
import { ASIA_REGIONS } from "@/lib/region-filter";
import type { PortKind } from "@/lib/types";

/** 탭 구성 — 각 탭은 안내 이미지 1장. '떠날 수 있는 크루즈 여행지'만 아래에 관광정보 카드가 붙는다. */
const TABS = [
  { key: "membership", label: "미리크루즈 상품안내", img: "/about-membership.jpg", alt: "미리크루즈 상품안내" },
  { key: "destinations", label: "떠날 수 있는 크루즈 여행지", img: "/about-destinations.jpg", alt: "떠날 수 있는 크루즈 여행지" },
  { key: "contract", label: "회원이용 및 계약 안내", img: "/about-contract.jpg", alt: "회원이용 및 계약 안내" },
] as const;

// 안내 이미지 원본이 가로 4001px 이라 크게 띄워도 선명하다. 800px 로 두면 좌우 여백만 넓어진다.
const IMG_MAX_W = "max-w-[1280px]";

// 관광정보 카드 지역 정렬 (관리자 관광정보 카드 관리와 동일한 순서)
const REGION_ORDER = ["서부지중해", "동부지중해", "북유럽", "미주·알래스카", "중동", "동남아", "동북아"];
const regionLabel = (r: string) => (ASIA_REGIONS.includes(r) ? "동남아/동북아" : r);
const regionRank = (r: string) => {
  const i = REGION_ORDER.indexOf(r);
  return i < 0 ? REGION_ORDER.length : i;
};
// 동남아·동북아는 한 칩으로 묶어 보여준다 (관리자 관광정보 카드 관리와 동일)
const sameRegionGroup = (a: string, b: string) =>
  a === b || (ASIA_REGIONS.includes(a) && ASIA_REGIONS.includes(b));

const KINDS: PortKind[] = ["기항지", "관광지"];

export default function AboutTabs() {
  const [tab, setTab] = useState<string>(TABS[0].key);
  // 한 번이라도 연 탭은 DOM에 남겨 두고 숨기기만 한다 → 다시 눌러도 이미지·목록을 새로 불러오지 않는다
  const [visited, setVisited] = useState<Set<string>>(() => new Set([TABS[0].key]));

  const select = (key: string) => {
    setVisited((s) => (s.has(key) ? s : new Set(s).add(key)));
    setTab(key);
  };

  // 첫 화면이 다 그려진 뒤 나머지 탭 이미지를 백그라운드로 미리 받아 둔다 (전환 시 빈 화면 방지)
  useEffect(() => {
    const timer = setTimeout(() => {
      for (const t of TABS) {
        const img = new window.Image();
        img.src = t.img;
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ fontSize: "var(--font-base)" }}>
      {/* 탭 */}
      <div className="border-b border-slate-200">
        <nav className="mx-auto flex w-full max-w-[1280px] justify-center gap-2 overflow-x-auto px-5 [scrollbar-width:none] max-[991px]:justify-start [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => select(t.key)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-[min(1.045vw,20.064px)] max-[991px]:text-[min(3.2547vw,19.5282px)] max-[501px]:text-[3.6vw] font-bold transition ${
                tab === t.key
                  ? "border-brand text-brand" // 상세페이지 탭과 동일 (--brand-blue #1d4ed8)
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 내용 — 방문한 탭은 계속 붙여 두고 CSS 로만 감춘다 */}
      {TABS.filter((t) => visited.has(t.key)).map((t) => (
        <div key={t.key} className={t.key === tab ? "" : "hidden"}>
          <div className="mx-auto mt-10 w-full px-5 max-[991px]:mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.img} alt={t.alt} className={`mx-auto block h-auto w-full ${IMG_MAX_W}`} />
          </div>
          {/* 여행지 탭에만 — 관광정보 카드 */}
          {t.key === "destinations" && <PortCards />}
        </div>
      ))}
    </div>
  );
}

/** 관광정보 카드 관리에 등록된 카드를 기항지/관광지 · 지역별로 보여준다 */
function PortCards() {
  const { ports, loading } = usePorts();
  const [kind, setKind] = useState<PortKind>("기항지");
  const [region, setRegion] = useState("전체");

  const kindPorts = ports.filter((p) => (p.kind ?? "기항지") === kind);

  // 권역 칩 — 실제 카드가 있는 권역만, 정해진 순서로 (동남아·동북아는 한 칩으로 합침)
  const regionChips = [...new Set(kindPorts.map((p) => p.region))]
    .sort((a, b) => regionRank(a) - regionRank(b) || a.localeCompare(b))
    .reduce<{ region: string; count: number }[]>((acc, r) => {
      const merged = ASIA_REGIONS.includes(r) ? acc.find((c) => ASIA_REGIONS.includes(c.region)) : undefined;
      const count = kindPorts.filter((p) => p.region === r).length;
      if (merged) merged.count += count;
      else acc.push({ region: r, count });
      return acc;
    }, []);

  // 기항지↔관광지를 바꾸면 없는 권역이 선택돼 있을 수 있으므로 전체로 되돌린다
  const activeRegion = regionChips.some((c) => sameRegionGroup(c.region, region)) ? region : "전체";
  const list = activeRegion === "전체" ? kindPorts : kindPorts.filter((p) => sameRegionGroup(p.region, activeRegion));

  // 지역별로 묶고 정해진 순서로 정렬 (지역 안에서는 관리자에서 지정한 order)
  const groups = [...new Set(list.map((p) => p.region))]
    .sort((a, b) => regionRank(a) - regionRank(b) || a.localeCompare(b))
    .map((r) => ({
      region: r,
      cards: list
        .filter((p) => p.region === r)
        .sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999) || a.name.localeCompare(b.name)),
    }));

  return (
    <section className="mx-auto mt-16 w-full max-w-[1280px] px-5 max-[991px]:mt-10">
      <div className="mb-8 text-center">
        <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.4757vw] font-semibold tracking-[0.35em] text-gold">
          DESTINATION GUIDE
        </p>
        <h2 className="mt-3 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[5.62vw] font-black text-navy">
          여행지 상세 안내
        </h2>
      </div>

      {/* 기항지 / 관광지 */}
      <div className="mb-6 flex justify-center gap-2">
        {KINDS.map((k) => {
          const count = ports.filter((p) => (p.kind ?? "기항지") === k).length;
          return (
            <button
              key={k}
              onClick={() => { setKind(k); setRegion("전체"); }}
              className={`rounded-none px-5 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold transition ${
                kind === k ? "bg-brand text-white" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {k} <span className="opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 권역 필터 — 원하는 지역만 골라 볼 수 있다 */}
      {regionChips.length > 0 && (
        <div className="mb-8 flex flex-wrap justify-center gap-1.5">
          {[{ region: "전체", count: kindPorts.length }, ...regionChips].map((c) => (
            <button
              key={c.region}
              type="button"
              onClick={() => setRegion(c.region)}
              className={`rounded-lg px-3 py-1.5 text-[min(0.9075vw,17.424px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-semibold transition ${
                sameRegionGroup(activeRegion, c.region)
                  ? "bg-navy text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {regionLabel(c.region)} <span className="opacity-70">{c.count}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          불러오는 중…
        </p>
      ) : groups.length === 0 ? (
        <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          등록된 카드가 없습니다.
        </p>
      ) : (
        groups.map(({ region, cards }) => (
          <div key={region} className="mt-10 first:mt-0">
            <h3 className="mb-4 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">
              {regionLabel(region)}
              <span className="ml-2 text-[0.8em] font-normal text-slate-400">{cards.length}곳</span>
            </h3>
            <div className="grid grid-cols-3 gap-5 max-[991px]:grid-cols-2 max-[501px]:grid-cols-1">
              {cards.map((p) => (
                <article key={p.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <PortImages card={p} alt={p.name} itemClass="h-48" />
                  <div className="p-4">
                    <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-gold">{p.country}</p>
                    <p className="mt-1 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">{p.name}</p>
                    <p className="mt-2 whitespace-pre-line text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] leading-relaxed text-slate-500">
                      {p.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
