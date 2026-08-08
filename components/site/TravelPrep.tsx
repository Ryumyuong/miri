/**
 * 여행준비 안내 — 일정 상세페이지(영상 ↔ 안전/유의사항 사이) 고정 안내 섹션.
 * 8개 카드(여권/신용카드/환전/복장/준비물/반입금지/전기/욕실).
 */

type Line = { t: string; b?: boolean };
type Card = { img: string; title: string; lines: Line[] };

const CARDS: Card[] = [
  {
    img: "passport",
    title: "여권과 비자",
    lines: [
      { t: "출발일 기준 유효기간이 6개월 이상 남아 있는지 필수 확인!", b: true },
      { t: "각 나라별 비자 유무는 여행사 담당자를 통해 확인 바랍니다." },
    ],
  },
  {
    img: "card",
    title: "신용카드",
    lines: [
      { t: "모든 선내 이용 금액은 신용카드로 결제 할 수 있습니다.", b: true },
      { t: "신용카드와 방키를 인솔인자가 현장에서 연동해드립니다." },
      { t: "신용카드는 해외 사용가능한 'VISA', \"MASTER\" 카드로 준비 부탁드리며, 체크카드는 사용불가합니다." },
    ],
  },
  {
    img: "money",
    title: "환전",
    lines: [
      { t: "크루즈 선내 모든 비용은 신용카드 사용이 가능합니다.", b: true },
      { t: "신용카드가 없을 경우 현금 예치를 해야합니다. (100달러 또는 100유로)" },
      { t: "기항지 투어 시 일부 상점은 카드사용이 불가 할 수 있으므로, 비상금과 현지에서 사용하실 현금을 소액 환전하시면 됩니다." },
    ],
  },
  {
    img: "dress",
    title: "복장",
    lines: [
      { t: "전반적으로 한국 날씨와 비슷합니다. 일교차가 큰편이니 겉옷을 준비해주시고, 선내온도는 22도 내외로 유지됩니다." },
      { t: "권장사항 - 정장 또는 한복 1벌" },
      { t: "• 남자 - 정장/셔타이/구두 또는 한복" },
      { t: "• 여자 - 정장 또는 드레스 또는 한복" },
      { t: "선내에서는 편한 복장으로 생활하시면 됩니다." },
    ],
  },
  {
    img: "luggage",
    title: "준비물",
    lines: [
      { t: "• 모자, 선글라스, 선블럭, 운동화등" },
      { t: "• 평상시 복장 : 가벼운 캐주얼 복장- 보온 점퍼, 가디건, 티셔츠, 운동화 등 가벼운 옷 여러벌 챙기는 것을 권장 드립니다" },
      { t: "• 수영장 이용시 반드시 수영복 또는 래쉬가드 필수! (반바지나 민소매(나시) 착용시 수영장 이용 불가합니다.)" },
      { t: "• 상비약 (상시 복용하는 의약품은 필수 준비해야 합니다) 멀미약, 소화제, 감기약, 진통제 등" },
      { t: "• 기항지 관광 시 가족 당 1개의 작은 손가방을 휴대하시면 좋습니다. 여성용 큰 핸드백도 좋습니다." },
      { t: "• 기타 일반 휴대품 (세면도구, 면도기 등 1회 용품, 휴대용 양산 및 우산)" },
      { t: "• 고체 비누와 액상비누는 준비되어 있으나 환경문제로 샴푸나 린스 등은 구비되어 있지 않습니다." },
      { t: "• 객실 내 서랍에 헤어드라이기가 수납되어 있습니다. 다만 출력이 약한 편이니 별도로 준비하셔도 무방합니다." },
    ],
  },
  {
    img: "prohibition",
    title: "반입 금지 물품",
    lines: [
      { t: "• 전열기구 : 전기장판, 조리기구, 고데기, 다리미 등 화재의 위험이 있는 물건" },
      { t: "• 식음료 : 물, 주류, 음료, 가공 및 진공 포장 되지 않은 음식물류 등" },
      { t: "• 기타 : 칼, 폭발물, 독성물질, 총기류, 공구, 드론 등" },
      { t: "• 상기 물품이 수하물에 들어 있을 경우, 짐이 객실로 배달 되지 않을 수 있습니다. 저녁식사 후에도 짐이 방으로 배달 되지 않으신 분들은 인솔자에게 말씀 부탁드립니다." },
      { t: "• 맥주/양주 등 주류반입은 금지되며, 기항지에서 선물로 구매하신 술도 승선시, 선사에 보관 후 하선날 찾으실 수 있습니다." },
    ],
  },
  {
    img: "outlet",
    title: "전기[콘센트]",
    lines: [
      { t: "객실에서 220V 사용이 가능합니다." },
      { t: "객실당 콘센트가 1개 내지 2개 있기 때문에 추가로 이용하실 분들은 멀티콘센트를 추가로 준비해주셔도 좋습니다." },
    ],
  },
  {
    img: "bathroom",
    title: "욕실",
    lines: [
      { t: "수건, 비누, 티슈, 양치컵은 구비되어 있습니다." },
      { t: "수건은 큰수건, 작은수건이 있으며, 매일 교체해줍니다." },
      { t: "샤워부스 사용시 물이 바닥에 흐르지 않게 이용 부탁드립니다." },
    ],
  },
];

const TITLE_CLS =
  "text-[min(1.7188vw,33px)] max-[991px]:text-[min(5.35vw,32px)] max-[501px]:text-[6.4vw]";
const SUB_CLS =
  "text-[min(1.25vw,24px)] max-[991px]:text-[min(3.9vw,23.4px)] max-[501px]:text-[4.4vw]";
const CARD_TITLE_CLS =
  "text-[min(1.3542vw,26px)] max-[991px]:text-[min(4.22vw,25.3px)] max-[501px]:text-[4.9vw]";
const BODY_CLS =
  "text-[min(0.9375vw,18px)] max-[991px]:text-[min(2.92vw,17.5px)] max-[501px]:text-[3.55vw]";

export default function TravelPrep() {
  return (
    <div>
      {/* 헤더 */}
      <div className={`flex items-center gap-[0.4em] font-extrabold leading-none ${TITLE_CLS}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/travel-prep/info.png" alt="" className="h-[1.05em] w-[1.05em] shrink-0 object-contain" />
        <h2>
          <span className="text-[#1E4D8B]">여행준비</span> <span className="text-black">안내</span>
        </h2>
      </div>
      <p className={`mt-[0.7em] font-normal text-black/70 ${SUB_CLS}`}>
        크루즈 여행을 더욱 편안하고 즐겁게, 꼭 확인해 주세요.
      </p>

      {/* 카드 */}
      <div className="mt-8 flex flex-col gap-6">
        {CARDS.map((c) => (
          <div key={c.title} className="rounded-[10px] border border-[#1E4D8B]/15 bg-white p-6 max-[501px]:p-4">
            <div className="flex gap-6 max-[501px]:flex-col max-[501px]:gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/travel-prep/${c.img}.png`}
                alt={c.title}
                className="aspect-[581/360] w-[15em] shrink-0 self-start rounded-[5px] object-cover max-[991px]:w-[12em] max-[501px]:w-full"
              />
              <div className="min-w-0 flex-1">
                <h3 className={`font-extrabold text-[#1E4D8B] ${CARD_TITLE_CLS}`}>{c.title}</h3>
                <div className="my-[0.9em] border-t-[0.5px] border-black/40" />
                <div className="flex flex-col gap-[0.35em]">
                  {c.lines.map((l, i) => (
                    <p
                      key={i}
                      className={`whitespace-pre-line leading-[1.7] ${BODY_CLS} ${
                        l.b ? "font-bold text-black" : "font-light text-black/70"
                      }`}
                    >
                      {l.t}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
