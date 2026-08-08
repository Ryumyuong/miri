// 코스타 토스카나 서부지중해 11일 일정 작성 (이미지 기준). 실행: node scripts/seed-toscana-itin.mjs
// 항공편은 일정 텍스트에 간단히 표기, 관광지는 관광카드(tourCardId) 있으면 연결.
// 이미지 블록(공항 지도·관광 프로그램 그래픽)은 추후 사용자가 이미지 주면 추가.
import { initializeApp } from "firebase/app";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const VOYAGE_ID = "8srXFNFNxecVMuvBL9GW";
let n = 0;
const b = (type, props) => ({ id: `tsc-${n++}`, type, ...props });

const days = [
  { dayNo: 0, blocks: [
    b("content", { text: "[22:20] 인천공항 미팅 [미팅보드 추후 안내 예정]\n· 미팅장소: 인천공항 1청사 3층 출국장\n· 그룹 항공권을 이용하기 때문에 출발 3시간 전까지 반드시 항공 체크인을 해주시기 바랍니다.\n· 사전 좌석 배정은 불가하며, 출발 당일 항공사 탑승수속 창구에서 단체로 좌석이 배정됩니다. 공항 미팅 시간에 늦거나 당일 항공좌석이 만석일 수 있음을 양해 부탁드립니다." }),
  ]},
  { dayNo: 1, blocks: [
    b("content", { text: "[01:20] 인천 국제공항 출발 QR0859\n[05:30] 도하 국제공항 도착 후 환승 게이트로 이동\n[09:25] 도하 국제공항 출발 QR0131\n[14:15] 로마 국제공항 도착\n현지 가이드 미팅 후 로마관광" }),
    b("text", { title: "로마 관광 프로그램 안내", text: "· 로마에서 가장 아름다운 분수 트레비 분수\n· 모든 신을 위한 신전 '판테온'\n· 코르소 거리에 위치한 나보나 광장 등" }),
    b("tour", { tourCardId: "hoD44wnGPJGQR1Ed80Xw" }),
    b("tour", { tourCardId: "LjK0cUSs717iY5Yy9U35" }),
    b("content", { text: "석식 후 호텔 체크인 및 휴식" }),
    b("lodging", { lodgeName: "Ergife Palace Hotel & Conference (4성급) 또는 동급" }),
    b("meal", { meal: "조식", place: "기내식" }),
    b("meal", { meal: "중식", place: "기내식" }),
    b("meal", { meal: "석식", place: "현지식" }),
  ]},
  { dayNo: 2, blocks: [
    b("content", { text: "[09:00] 호텔 조식 후 가이드 미팅하여 로마 관광" }),
    b("text", { title: "로마 관광 프로그램 안내", text: "· 고대 로마의 원형경기장인 콜로세움(외관)\n· 로마 정치의 중심지 포로 로마노(외관) 등" }),
    b("tour", { tourCardId: "zNEumgiz9fbn68XdUWwS" }),
    b("tour", { tourCardId: "iUVZ1UPv2RpndrHpKBIS" }),
    b("content", { text: "[19:00] 크루즈 터미널로 이동하여 승선 수속\n승선 후 쉽투어 진행 및 안전훈련 참여\n크루즈 출항" }),
    b("ship", { shipName: "코스타 토스카나호", boarding: "톤수 182,700톤 / 첫 출항 2021년 03월", departure: "총 탑승객 6,218명 / 승무원 1,678명" }),
    b("lodging", { lodgeName: "코스타 토스카나호 (선상)" }),
    b("meal", { meal: "조식", place: "호텔식" }),
    b("meal", { meal: "중식", place: "현지식" }),
    b("meal", { meal: "석식", place: "선상식" }),
  ]},
  { dayNo: 3, blocks: [
    b("content", { text: "[08:30] 이탈리아 '사보나' 도착 후 하선\n현지 가이드 미팅하여 사보나 시내 기항지 관광" }),
    b("text", { title: "사보나 관광 프로그램 안내", text: "· 가리발디 거리\n· 페라리 광장\n· 제노아 두오모 성당\n· 콜럼버스 생가" }),
    b("tour", { tourCardId: "9MckogtPzoeq2zcSiz5F" }),
    b("tour", { tourCardId: "tFU2mlq9hW3eLPP3bWc5" }),
    b("content", { text: "중식 후 크루즈로 복귀\n[17:30] 크루즈 출항" }),
    b("lodging", { lodgeName: "코스타 토스카나호 (선상)" }),
    b("meal", { meal: "조식", place: "선상식" }),
    b("meal", { meal: "중식", place: "현지식" }),
    b("meal", { meal: "석식", place: "선상식" }),
  ]},
  { dayNo: 4, blocks: [
    b("content", { text: "[09:00] 프랑스 '마르세유' 도착 및 하선\n한국인 가이드 미팅 및 기항지 관광" }),
    b("text", { title: "마르세유 관광 프로그램 안내", text: "· 근교 엑상 프로방스 투어\n· 마르세유 구 항구\n· 마조르 대성당\n· 롱샹 궁전" }),
    b("tour", { tourCardId: "SNWwpjtGKfHc9FGo9vdp" }),
    b("tour", { tourCardId: "OQnqQZJJNswrRqHoXOUi" }),
    b("content", { text: "[18:00] 크루즈 출항" }),
    b("lodging", { lodgeName: "코스타 토스카나호 (선상)" }),
    b("meal", { meal: "조식", place: "선상식" }),
    b("meal", { meal: "중식", place: "현지식" }),
    b("meal", { meal: "석식", place: "선상식" }),
  ]},
  { dayNo: 5, blocks: [
    b("content", { text: "[09:00] 스페인 '바르셀로나' 도착 및 하선\n한국인 가이드 미팅 및 기항지 관광" }),
    b("text", { title: "바르셀로나 관광 프로그램 안내", text: "· 몬세랏 수도원\n· 사그라다 파밀리아 성당\n· 시내 파노라마 투어\n· 람블라스 거리" }),
    b("tour", { tourCardId: "8GkOHEH2G6I7w7KFr1s5" }),
    b("tour", { tourCardId: "reWtaCWl9cI2d8i60LAX" }),
    b("content", { text: "[19:00] 크루즈 출항" }),
    b("lodging", { lodgeName: "코스타 토스카나호 (선상)" }),
    b("meal", { meal: "조식", place: "선상식" }),
    b("meal", { meal: "중식", place: "한식" }),
    b("meal", { meal: "석식", place: "선상식" }),
  ]},
  { dayNo: 6, blocks: [
    b("content", { text: "[09:00] 스페인 팔마 데 마요르카 도착\n조식 후 하선하여 가이드 미팅 및 관광 진행" }),
    b("text", { title: "팔마 데 마요르카 관광 프로그램 안내", text: "· 유네스코로 지정된 중세마을 발데모사\n· 사 포라다 전망대" }),
    b("content", { text: "크루즈 복귀하여 저녁식사\n[19:00] 크루즈 출항" }),
    b("lodging", { lodgeName: "코스타 토스카나호 (선상)" }),
    b("meal", { meal: "조식", place: "선상식" }),
    b("meal", { meal: "중식", place: "선상식" }),
    b("meal", { meal: "석식", place: "선상식" }),
  ]},
  { dayNo: 7, blocks: [
    b("content", { text: "선내 프로그램 참여 및 자유시간" }),
    b("text", { title: "[선내 유료 서비스 추천]", text: "코스타 크루즈는 유료시설의 저렴한 비용 대비 높은 퀄리티로 가성비가 좋기로 유명합니다. 유료시설 및 서비스들을 이용해 볼 것을 적극 권합니다.\n* 음료 및 주류 : 이탈리아의 인기있는 식전주인 아페롤 스프리츠는 크루즈와 매우 잘 어울리는 아름다운 오렌지색의 칵테일로 코스타 크루즈에서 꼭 즐겨보세요. 또한 이탈리아를 비롯한 유럽의 와인을 전문적으로 소개해주는 소믈리에가 상주하고 있어 와인에 대한 관심이 높으신 분들은 꼭 한번 와인을 즐겨보세요.\n* 유료 레스토랑 : 코스타의 가장 하이라이트 유료 레스토랑은 철판요리인 테판야끼가 있습니다. 인기가 많아 예약이 빨리 마감되니 관심있으신 분은 미리 문의해 주세요!\n* 스파&마사지 : 코스타 크루즈의 스파&마사지 서비스는 부드러운 스웨디시 마사지를 비롯하여 얼음방, 건식사우나, 온열침대, 온탕 등의 고급스러운 시설들이 꽉 차 있을 정도로 인기가 좋습니다." }),
    b("lodging", { lodgeName: "코스타 토스카나호 (선상)" }),
    b("meal", { meal: "조식", place: "선상식" }),
    b("meal", { meal: "중식", place: "선상식" }),
    b("meal", { meal: "석식", place: "선상식" }),
  ]},
  { dayNo: 8, blocks: [
    b("content", { text: "[08:00] 이탈리아 '팔레르모' 도착\n하선하여 현지 가이드 미팅 및 기항지 관광" }),
    b("text", { title: "팔레르모 관광 프로그램 안내", text: "· 콰트로 칸티, 팔레르모 대성당\n· 트레토리아 분수\n· 마시모 오페라 극장\n· 포르타 누오바 성문 등" }),
    b("tour", { tourCardId: "ghvPsiLGwyvUYG1SjKf7" }),
    b("content", { text: "[16:30] 크루즈 출항" }),
    b("lodging", { lodgeName: "코스타 토스카나호 (선상)" }),
    b("meal", { meal: "조식", place: "선상식" }),
    b("meal", { meal: "중식", place: "선상식" }),
    b("meal", { meal: "석식", place: "선상식" }),
  ]},
  { dayNo: 9, blocks: [
    b("content", { text: "[08:30] 이탈리아 로마 도착 및 최종 하선\n현지 가이드 미팅하여 브라치아노 호수 관광\n중식 후 로마 국제공항으로 이동하여 항공 체크인\n[16:10] 로마 국제공항 출발 QR0132\n[22:40] 도하 국제공항 도착 후 환승 게이트로 이동" }),
    b("meal", { meal: "조식", place: "선상식" }),
    b("meal", { meal: "중식", place: "현지식" }),
    b("meal", { meal: "석식", place: "기내식" }),
  ]},
  { dayNo: 10, blocks: [
    b("content", { text: "[02:20] 도하 국제공항 출발 QR0858\n[17:05] 인천 국제공항 도착\n\n안전히 귀가하시기 바랍니다~" }),
    b("meal", { meal: "조식", place: "기내식" }),
    b("meal", { meal: "중식", place: "기내식" }),
    b("meal", { meal: "석식", place: "기내식" }),
  ]},
];

await updateDoc(doc(db, "voyages", VOYAGE_ID), { itineraryDays: days, itineraryStatus: "draft" });
console.log(`✅ 코스타 토스카나 일정 ${days.length}일차 저장 완료 (상태: draft)`);
console.log(`총 블록: ${days.reduce((s, d) => s + d.blocks.length, 0)}개`);
process.exit(0);
