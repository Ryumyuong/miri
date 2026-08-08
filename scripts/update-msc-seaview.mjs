// MSC 씨뷰호 2026.08.28 서부지중해 — 상세 데이터 채우기. 실행: node scripts/update-msc-seaview.mjs
// 제목으로 기존 문서를 찾아 상세 필드를 업데이트(없으면 추가). 유의사항(safety)은 앱 기본값 사용(미설정).
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI",
  authDomain: "miri-6246c.firebaseapp.com",
  projectId: "miri-6246c",
  storageBucket: "miri-6246c.firebasestorage.app",
  messagingSenderId: "143650281515",
  appId: "1:143650281515:web:b459ea9481f2baeea7b26e",
});
const db = getFirestore(app);

const TITLE = "2026년 08월 28일 서부 지중해 크루즈 - MSC [씨뷰호]";

const detail = {
  title: TITLE,
  region: "유럽",
  shipName: "MSC 씨뷰호",
  line: "MSC Cruises",
  departDate: "2026-08-28",
  arriveDate: "2026-09-07",
  nights: 8,
  days: 11,
  priceFrom: 5940000,
  countries: ["이탈리아", "프랑스", "스페인"],
  flight: "카타르항공 QR859 (08.28 01:20 인천 → 14:15 현지) · QR858 (09.06 16:10 현지 → 09.07 17:05 인천)",
  description:
    "누구나 한번은 꿈꾸는 크루즈 여행. 행사코드 ESBCN11526525100175988 · 여행기간 8박 11일. MSC 씨뷰호와 함께 이탈리아·프랑스·스페인 서부지중해 3개국을 일주합니다.",
  features: [
    "여유로운 유럽 여행! 이탈리아/프랑스/스페인 서부지중해 3개국 일주",
    "매일 짐을 꾸렸다 풀 필요 없는 여유로운 크루즈 여행",
  ],
  included: [
    "왕복 항공요금",
    "크루즈 객실 (2인 1실 기준)",
    "출/도착지 및 기항지 관광",
    "크루즈 전문 인솔자",
    "유류할증료 및 각종 제세금",
    "크루즈 선상팁",
    "해외여행자보험",
  ],
  excluded: ["개인 지출 비용", "선내 유료시설 이용료", "개인 매너팁"],
  terms: [
    "[약관] (국외여행 특별약관) — 예약 취소 시 수수료에 관한 규정 (국외 여행약관 참조)",
    "※ 본 크루즈여행 상품은 선사 및 항공사의 규정에 따라 본 특별 약관이 적용됩니다.",
    "※ 여행 예약 및 취소에 있어서 규정과 요금은 이 약관에 따라 정해집니다.",
    "※ 일부 상황에서는 국외 여행 표준약관이 보충적으로 적용될 수 있습니다.",
    "※ 고객의 이해와 안전을 위해 약관 내용을 주의깊게 확인하시기 바랍니다.",
    "크루즈 여행 취소 시, 다음과 같은 취소수수료가 부과됩니다.",
    "– 여행 확정 후 출발 120~91일 전 취소 : 총 여행 상품가격의 5% + 항공 선발권 취소수수료 + 선실 업그레이드 비용 전액",
    "– 여행 확정 후 출발 90~71일 전 취소 : 총 여행 상품가격의 25% + 항공 선발권 취소수수료 + 선실 업그레이드 비용 전액",
    "– 여행 확정 후 출발 70~46일 전 취소 : 총 여행 상품가격의 50% + 항공 선발권 취소수수료 + 선실 업그레이드 비용 전액",
    "– 여행 확정 후 출발 45~21일 전 취소 : 총 여행 상품가격의 75% + 항공 선발권 취소수수료 + 선실 업그레이드 비용 전액",
    "– 여행 확정 후 출발 20~출발일 전 취소 : 총 여행 상품가격의 100% + 항공 선발권 취소수수료 + 선실 업그레이드 비용 전액",
    "해당 특별 약관은 일정별·지역별로 상이하니 일정에 따른 특별약관을 필히 확인하시기 바랍니다.",
    "※ 근무일(공휴일 및 토·일요일 제외) 및 근무시간(18시까지) 내 취소요청에 한하여 적용됩니다.",
    "※ 위의 내용은 국외여행 표준약관에 의거하였으며 소비자피해보상규정(공정거래위원회 고시)에 따라 배상합니다.",
    "※ 최저 행사인원 미충족 시 계약 해제 — 최저 행사인원이 충족되지 아니하여 여행계약을 해제하는 경우 여행 출발 7일 전까지 여행자에게 통지하여야 합니다.",
    "여행 참가자 수 미달로 기일 내 통지 없이 계약을 해제하는 경우, 이미 지급받은 계약금 환급 외에 ① 출발 1일 전까지 통지 시 여행요금의 30% ② 출발 당일 통지 시 여행요금의 50%를 배상합니다.",
    "※ 행사 진행 중 천재지변 및 불가피한 상황 발생으로 소요되는 비용은 고객님께서 부담하셔야 합니다.",
    "※ 취소 기준일은 취소를 통지한 날로, 여행사와 항공사의 업무 특성상 영업일(월~금 09:00~18:00, 공휴일 제외) 기준입니다.",
  ],
};

const snap = await getDocs(collection(db, "voyages"));
const existing = snap.docs.find((d) => d.data().title === TITLE);

if (existing) {
  await updateDoc(doc(db, "voyages", existing.id), detail);
  console.log("UPDATED:", existing.id);
} else {
  const ref = await addDoc(collection(db, "voyages"), detail);
  console.log("ADDED:", ref.id);
}
process.exit(0);
