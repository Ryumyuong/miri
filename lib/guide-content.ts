/** 크루즈 가이드 콘텐츠 — 카드(GuideGrid)와 상세 페이지(/guide/[slug])가 함께 사용. */

export type GuideSection = { title: string; body: string; image?: string };

export type GuideTopic = {
  slug: string;
  icon: string; // /icons/guide-grid/{icon}.png
  image: string; // 카드/상세 배너 이미지 (/guide/{slug}.webp)
  title: string;
  desc: string; // 카드 설명(짧게)
  subtitle: string; // 상세 페이지 부제
  sections: GuideSection[];
};

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    slug: "about",
    icon: "ship",
    image: "/guide/about.webp",
    title: "크루즈 여행이란?",
    desc: "크루즈 여행의 모든 것, 처음 떠나시는 분들을 위한 완벽 가이드",
    subtitle: "처음 떠나시는 분들을 위한 완벽 가이드",
    sections: [
      {
        title: "크루즈의 장점과 매력",
        image: "/guide/about-1.webp",
        body: "크루즈는 짐을 한 번 풀면 여러 나라·도시를 이동하며 즐길 수 있는 여행 방식입니다. 호텔·식사·엔터테인먼트가 모두 포함되어 있어 여행 내내 별도 비용 걱정 없이 편안하게 즐기실 수 있습니다.",
      },
      {
        title: "일반 여행과의 차이점",
        image: "/guide/about-2.webp",
        body: "일반 패키지 여행은 매일 짐을 챙겨 이동해야 하지만, 크루즈는 객실이 곧 이동하는 숙소입니다. 기항지마다 자유롭게 관광하고 저녁에는 선박으로 돌아와 편안한 밤을 보낼 수 있습니다.",
      },
      {
        title: "크루즈 여행 준비물",
        image: "/guide/about-3.webp",
        body: "여권(유효기간 6개월 이상), 여행자 보험 증서, 항공권, 편안한 캐주얼 의류와 공식 저녁 만찬용 정장(포멀 나이트), 선크림·멀미약·상비약을 준비해 오시면 좋습니다.",
      },
      {
        title: "베스트 시즌 안내",
        image: "/guide/about-4.webp",
        body: "유럽 크루즈는 5~9월이 성수기입니다. 지중해는 6~8월 가장 맑고 따뜻하며, 북유럽·피요르드는 6~7월을 추천합니다. 알래스카 크루즈는 5~9월, 카리브해는 11~4월이 적합합니다.",
      },
    ],
  },
  {
    slug: "embarkation",
    icon: "suitcase",
    image: "/guide/embarkation.webp",
    title: "승선 안내",
    desc: "체크인부터 승선까지의 전 과정",
    subtitle: "체크인부터 승선까지의 전 과정",
    sections: [
      {
        title: "체크인 절차",
        image: "/guide/embarkation-1.webp",
        body: "크루즈 카운터에서 여권과 함께 체크인을 진행합니다. 보딩패스와 선상 카드를 받고, 선상 카드에 해외 승인이 가능한 신용카드 또는 현금(달러) 보증금을 예치합니다. 보증금은 보통 300달러 이상이며 일정에 따라 달라질 수 있습니다.",
      },
      {
        title: "수하물 처리",
        image: "/guide/embarkation-2.webp",
        body: "귀중품을 제외한 선내 수하물 반입이 가능합니다(주류 제외). 큰 짐은 짐 표를 달아 맡기면 객실로 운반되며, 귀중품과 여권은 직접 소지하시기 바랍니다.",
      },
      {
        title: "승선 시간",
        image: "/guide/embarkation-3.webp",
        body: "승선 후에는 본인 확인 촬영을 진행합니다. 이 정보는 이후 승·하선 시 선상 카드를 스캔해 신분을 확인하는 용도로 사용됩니다. 미팅 시간은 보통 출발 3시간 전이며, 구체적인 시간은 출발 7일 전 안내됩니다.",
      },
      {
        title: "필수 서류 안내",
        image: "/guide/embarkation-4.webp",
        body: "승선 시 각 나라 이민국 확인을 위해 승무원에게 여권을 제출한 뒤 본인 객실로 이동합니다. 출항 30분~1시간 전에는 비상시 대피 훈련(필수)이 진행되니 선상 카드를 지참하고 반드시 참석해야 합니다.",
      },
    ],
  },
  {
    slug: "onboard-card",
    icon: "card",
    image: "/guide/onboard-card.webp",
    title: "선상 카드 안내",
    desc: "편리한 선상 생활을 위한 결제 시스템",
    subtitle: "편리한 선상 생활을 위한 결제 시스템",
    sections: [
      {
        title: "선상 카드 발급",
        image: "/guide/onboard-card-1.webp",
        body: "체크인 시 보딩패스와 함께 선상 카드를 발급받습니다. 이 카드 한 장이 캐빈(객실) 키, 선내 출입증, 선내 지불 수단의 세 가지 기능을 모두 수행합니다.",
      },
      {
        title: "사용 방법",
        image: "/guide/onboard-card-2.webp",
        body: "선내의 모든 결제는 현금 대신 선상 카드로 이루어지며, 승·하선 시에도 카드를 스캔해 신분을 확인합니다. 선상 팁이 미포함된 상품의 경우 팁도 선상 카드를 통해 자동 결제됩니다.",
      },
      {
        title: "결제 한도",
        image: "/guide/onboard-card-3.webp",
        body: "체크인 때 해외 승인이 가능한 신용카드를 등록하거나 현금 보증금(달러, 보통 300달러 이상)을 예치해 한도를 설정합니다. 보증금은 선상 카드와 연동됩니다.",
      },
      {
        title: "정산 절차",
        image: "/guide/onboard-card-4.webp",
        body: "정산은 하선 당일에 이루어집니다. 카드 등록 고객은 별도 절차 없이 자동 정산되며, 현금 보증금 고객은 안내된 장소에서 직접 정산합니다. 현금보다 카드가 편리합니다.",
      },
    ],
  },
  {
    slug: "cabins",
    icon: "home",
    image: "/guide/cabins.webp",
    title: "객실 종류",
    desc: "다양한 객실 등급과 특징",
    subtitle: "다양한 객실 등급과 특징",
    sections: [
      {
        title: "내부 객실",
        image: "/guide/cabins-1.webp",
        body: "크루즈에서 가장 보편적이고 합리적인 객실입니다. 창문이 없어 바다를 볼 수는 없지만 가격이 저렴해 젊은 여행객에게 인기입니다. 욕실 내 수건·샴푸·린스 등이 제공됩니다(선사별 상이).",
      },
      {
        title: "오션뷰 객실",
        image: "/guide/cabins-2.webp",
        body: "폐쇄형 창문으로 항해하는 바다를 감상할 수 있는 객실입니다(창문은 열 수 없음). 2인 이상이 예약한 경우 간이침대를 이용할 수 있으며, 욕실 어메니티가 제공됩니다.",
      },
      {
        title: "발코니 객실",
        image: "/guide/cabins-3.webp",
        body: "발코니를 통해 항해하는 바다를 직접 볼 수 있어 크루즈 객실 중 가장 인기가 높습니다. 신혼부부와 실버 층이 특히 선호하며, 욕실 어메니티가 제공됩니다(선사별 상이).",
      },
      {
        title: "스위트룸",
        image: "/guide/cabins-4.webp",
        body: "가장 넓고 고급스러운 최상위 객실입니다. 전용 발코니와 프리미엄 어메니티, 우선 승·하선 등 다양한 특전이 제공됩니다. 선사·등급에 따라 구성과 내부 디자인이 상이합니다.",
      },
    ],
  },
  {
    slug: "facilities",
    icon: "dining",
    image: "/guide/facilities.webp",
    title: "선내 시설",
    desc: "크루즈 선내의 다양한 부대시설",
    subtitle: "크루즈 선내의 다양한 부대시설",
    sections: [
      {
        title: "레스토랑 및 바",
        image: "/guide/facilities-1.webp",
        body: "정찬 레스토랑 외에도 스낵·뷔페 등 다수의 무료 레스토랑을 이용할 수 있으며, 세계적인 셰프의 특급 요리를 즐기는 유료 레스토랑도 있습니다. 라운지는 자유롭게 이용 가능하나 음료·주류는 유료입니다.",
      },
      {
        title: "수영장 & 스파",
        image: "/guide/facilities-2.webp",
        body: "수영장, 스파, 헤어 샵, 마사지 샵 등 다양한 휴식 시설을 갖추고 있습니다. 조깅트랙과 도서관, 회의 룸도 마련되어 있으며 일부 시설은 유료로 운영됩니다.",
      },
      {
        title: "엔터테인먼트",
        image: "/guide/facilities-3.webp",
        body: "댄스·쿠킹 클래스, 카지노, 빙고게임, 선상 칵테일 파티, 공연·쇼, 가라오케, 미니골프 등 다채로운 프로그램을 유·무료로 즐길 수 있습니다. 프로그램은 선사별로 상이합니다.",
      },
      {
        title: "쇼핑 & 카지노",
        image: "/guide/facilities-4.webp",
        body: "면세점에서 다양한 상품을 쇼핑하고 선내 카지노에서 게임을 즐길 수 있습니다. 인터넷(WIFI), 음료·주류, 사진 인화 서비스, 병원 등은 유료로 이용합니다.",
      },
    ],
  },
  {
    slug: "shore-excursion",
    icon: "map",
    image: "/guide/shore-excursion.webp",
    title: "기항지 관광",
    desc: "항구 도시에서의 자유 시간 활용법",
    subtitle: "항구 도시에서의 자유 시간 활용법",
    sections: [
      {
        title: "자유 관광 vs 선택 관광",
        image: "/guide/shore-excursion-1.webp",
        body: "기항지에서는 본인이 직접 이동·관광지를 정하는 자유관광, 가이드가 동행하는 기항지 관광(패키지), 한적하게 선내 시설을 즐기며 휴식하는 방법 중에서 선택할 수 있습니다.",
      },
      {
        title: "하선 시간 체크",
        image: "/guide/shore-excursion-2.webp",
        body: "항구 도착·출발 시간은 항구마다 다릅니다. 한국에서 예약할 때 정해지지만, 승선 후 선상신문이나 고객안내데스크에서 정확한 시간을 다시 확인하는 것이 안전합니다.",
      },
      {
        title: "추천 관광지",
        image: "/guide/shore-excursion-3.webp",
        body: "기항지 관광이란 승·하선 항구가 아닌 새로운 관광지를 방문하는 것입니다. 각 기항지의 대표 명소는 가이드가 동행하는 선택 관광(패키지)으로 효율적으로 둘러볼 수 있습니다.",
      },
      {
        title: "현지 교통수단",
        image: "/guide/shore-excursion-4.webp",
        body: "자유관광 시에는 도보, 셔틀버스, 택시 등 현지 교통수단을 이용합니다. 정해진 출발 시간에 늦지 않도록 여유 있게 항구로 복귀하셔야 합니다.",
      },
    ],
  },
  {
    slug: "disembarkation",
    icon: "exit",
    image: "/guide/disembarkation.webp",
    title: "하선 안내",
    desc: "마지막 날의 하선 절차",
    subtitle: "마지막 날의 하선 절차",
    sections: [
      {
        title: "수하물 정리",
        image: "/guide/disembarkation-1.webp",
        body: "하선 전날 객실로 짐 표(Luggage Tag, 색깔·번호 기재)가 전달됩니다. 귀중품·여권·최소한의 수하물을 제외한 짐은 짐 표를 달아 방문 앞에 내놓으면 터미널로 운반됩니다.",
      },
      {
        title: "선상 카드 정산",
        image: "/guide/disembarkation-2.webp",
        body: "하선 일 아침 사용 금액 내역서가 객실로 전달됩니다. 카드 등록 고객은 자동 정산되며, 현금 보증금 고객은 안내된 장소에서 결제를 완료합니다. 내역서 정산 이후에는 현금 결제가 불가합니다.",
      },
      {
        title: "하선 시간",
        image: "/guide/disembarkation-3.webp",
        body: "안내방송으로 색깔별 하선 순서가 공지되면 Gangway를 통해 하선합니다. 선상신문을 통해 여권 배부 날짜를 미리 확인하고 여권을 수령해 두시기 바랍니다.",
      },
      {
        title: "공항 이동",
        image: "/guide/disembarkation-4.webp",
        body: "터미널에서 짐 표를 확인한 후 수하물을 수취합니다. 하선 방송보다 일찍 내리면 수하물이 아직 도착하지 않아 대기시간이 발생할 수 있으니 안내된 순서에 맞춰 이동하세요.",
      },
    ],
  },
  {
    slug: "faq",
    icon: "question",
    image: "/guide/faq.webp",
    title: "자주 묻는 질문",
    desc: "크루즈 여행에 대한 궁금증 해결",
    subtitle: "크루즈 여행에 대한 궁금증 해결",
    sections: [
      {
        title: "복장 규정",
        image: "/guide/faq-1.webp",
        body: "낮에는 편안한 캐주얼 차림이면 충분합니다. 다만 '포멀 나이트' 등 공식 만찬에는 정장이나 드레스 등 격식 있는 복장이 권장됩니다.",
      },
      {
        title: "팁 문화",
        image: "/guide/faq-2.webp",
        body: "선상 팁은 보통 선상 카드를 통해 자동 결제됩니다(팁 미포함 상품의 경우). 별도의 현금 팁은 필수가 아닙니다.",
      },
      {
        title: "인터넷 사용",
        image: "/guide/faq-3.webp",
        body: "선내 인터넷(WIFI)은 유료로 제공됩니다. 패키지로 구매하면 더 합리적으로 이용할 수 있으며, 해상에서는 속도가 느릴 수 있습니다.",
      },
      {
        title: "의료 서비스",
        image: "/guide/faq-4.webp",
        body: "선내에는 병원이 있어 응급 상황에 대응합니다. 진료는 유료이므로 여행자 보험 가입과 상비약 준비를 권장합니다.",
      },
    ],
  },
];

export const guideTopicBySlug = (slug: string) => GUIDE_TOPICS.find((t) => t.slug === slug);
