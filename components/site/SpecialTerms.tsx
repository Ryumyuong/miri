function addDays(iso: string, n: number) {
  const d = new Date((iso || "") + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso || "";
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmtKDate(iso: string) {
  return `${iso.slice(0, 4)}년 ${iso.slice(5, 7)}월 ${iso.slice(8, 10)}일`;
}

/** 국외여행 특별약관 — 크루즈 취소수수료 규정 (여행개시일 기준 자동 계산) */
export default function SpecialTerms({ departDate }: { departDate: string }) {
  if (!departDate) return null;
  const range = (a: number, b: number) => `${fmtKDate(addDays(departDate, -a))} ~ ${fmtKDate(addDays(departDate, -b))}`;
  const tiers: { label: string; period: string; rate: string }[] = [
    { label: "출발 120 ~ 91일 전", period: range(120, 91), rate: "5%" },
    { label: "출발 90 ~ 71일 전", period: range(90, 71), rate: "25%" },
    { label: "출발 70 ~ 46일 전", period: range(70, 46), rate: "50%" },
    { label: "출발 45 ~ 21일 전", period: range(45, 21), rate: "75%" },
    { label: "출발 20일 전 ~ 출발일", period: range(20, 0), rate: "100%" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-[min(1.32vw,25.344px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-navy">국외여행 특별약관 — 예약 취소 시 수수료 규정</h3>
        <ul className="mt-3 flex flex-col gap-1.5 text-[min(0.99vw,19.008px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] leading-relaxed text-slate-400">
          <li>※ 본 크루즈여행 상품은 선사 및 항공사의 규정에 따라 본 특별약관이 적용됩니다.</li>
          <li>※ 여행 예약 및 취소에 있어서 규정과 요금은 이 약관에 따라 정해집니다.</li>
          <li>※ 일부 상황에서는 국외여행 표준약관이 보충적으로 적용될 수 있습니다.</li>
          <li>※ 고객의 이해와 안전을 위해 약관 내용을 주의깊게 확인하시기 바랍니다.</li>
        </ul>
      </div>

      {/* 취소수수료 5단계 (여행개시일 기준 자동 계산) */}
      <div className="bg-[#FBFBFD] px-6 py-4">
        <p className="mb-3 text-[min(1.089vw,20.9088px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw] font-bold text-navy">크루즈 여행 취소 시, 다음과 같은 취소수수료가 부과됩니다.</p>
        <div className="overflow-x-auto max-[991px]:hidden">
          <table className="w-full text-[min(0.8778vw,16.8538px)] max-[991px]:text-[min(2.2784vw,13.6704px)] max-[501px]:text-[2.767vw]">
            <thead>
              <tr className="text-[0.95em] text-slate-400">
                <th className="px-2.5 py-2 text-left font-medium">취소 시점 (여행 확정 후)</th>
                <th className="px-2.5 py-2 text-left font-medium">해당 기간</th>
                <th className="px-2.5 py-2 text-right font-medium">취소수수료</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t) => (
                <tr key={t.label} className="border-t border-slate-100">
                  <td className="px-2.5 py-2 font-medium text-slate-600">{t.label} 취소 시</td>
                  <td className="px-2.5 py-2 text-slate-500">{t.period}</td>
                  <td className="px-2.5 py-2 text-right">
                    <span className="font-bold text-brand">총 상품가격의 {t.rate} 배상</span>
                    <span className="block text-[0.72em] font-medium text-slate-400">+ 항공 선발권 취소수수료 + 선실 업그레이드 비용 전액</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일: 표 대신 카드형(세로 스택)으로 표시 */}
        <div className="hidden flex-col gap-2.5 max-[991px]:flex">
          {tiers.map((t) => (
            <div key={t.label} className="rounded-lg border border-slate-100 bg-white p-3 text-[min(1.089vw,20.9088px)] max-[991px]:text-[min(2.8266vw,16.9596px)] max-[501px]:text-[3.4328vw]">
              <p className="font-bold text-navy">{t.label} 취소 시</p>
              <p className="mt-0.5 text-[0.92em] text-slate-500">{t.period}</p>
              <div className="mt-2 border-t border-slate-100 pt-2">
                <span className="font-bold text-brand break-keep">총 상품가격의 {t.rate} 배상</span>
                <span className="mt-0.5 block text-[0.72em] font-medium text-slate-400 break-keep">
                  + 항공 선발권 취소수수료 + 선실 업그레이드 비용 전액
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[min(0.99vw,19.008px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-brand">
          해당 특별약관은 일정별·지역별로 상이하니, 일정에 따른 특별약관을 반드시 확인하시기 바랍니다.
        </p>
      </div>

      <ul className="flex flex-col gap-1.5 border-t border-slate-100 px-6 py-4 text-[min(0.99vw,19.008px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] leading-relaxed text-slate-400">
        <li>※ 근무일(공휴일 및 토·일요일 제외) 및 근무시간(17시까지) 내에 취소요청에 한하여 적용됩니다.</li>
        <li>※ 최저행사인원 미충족 시 계약해제 — 최저행사인원이 충족되지 아니하여 여행계약을 해제하는 경우 여행출발 7일 전까지 여행자에게 통지하여야 합니다.</li>
      </ul>
    </div>
  );
}
