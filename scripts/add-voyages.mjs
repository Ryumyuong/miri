// 운항 일정 일괄 추가 (캡쳐 데이터). 실행: node scripts/add-voyages.mjs
// 제목이 이미 존재하면 건너뜀(중복 방지). status·dDay·예약지표는 앱에서 자동 계산.
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI",
  authDomain: "miri-6246c.firebaseapp.com",
  projectId: "miri-6246c",
  storageBucket: "miri-6246c.firebasestorage.app",
  messagingSenderId: "143650281515",
  appId: "1:143650281515:web:b459ea9481f2baeea7b26e",
});
const db = getFirestore(app);

function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
// 8박11일 = 출발일 + 10일 귀항 → arrive = depart + (days - 1)
const arrive = (depart, days) => addDays(depart, days - 1);

const WEST = ["이탈리아", "스페인", "프랑스"]; // 서부지중해 공통

const raw = [
  { title: "2026년 08월 28일 서부 지중해 크루즈 - MSC [씨뷰호]", ship: "MSC 씨뷰호", line: "MSC Cruises", depart: "2026-08-28", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: [], flight: "카타르항공 (QR)" },
  { title: "2026년 10월 03일 서부 지중해 크루즈 7박10일 - MSC [씨뷰호]", ship: "MSC 씨뷰호", line: "MSC Cruises", depart: "2026-10-03", nights: 7, days: 10, price: 6640000, countries: WEST, itinerary: ["로마", "팔레르모", "이비자", "바르셀로나", "마르세유", "제노아", "로마"] },
  { title: "2026년 10월 16일 서부 지중해 크루즈 - MSC [씨뷰호]", ship: "MSC 씨뷰호", line: "MSC Cruises", depart: "2026-10-16", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: [], flight: "카타르항공 (QR)" },
  { title: "2026년 10월 21일 코스타 스메랄다호 - 서부지중해 11일", ship: "코스타 스메랄다호", line: "Costa Cruises", depart: "2026-10-21", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: ["로마", "사보나", "마르세유", "바르셀로나", "칼리아리", "팔레르모"] },
  { title: "2026년 10월 28일 서부지중해 8박 11일 [Costa Smeralda]", ship: "코스타 스메랄다호", line: "Costa Cruises", depart: "2026-10-28", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: ["로마", "사보나", "마르세유", "바르셀로나", "칼리아리", "팔레르모", "로마"] },
  { title: "2026년 11월 10일 코스타 토스카나호 - 서부지중해 11일", ship: "코스타 토스카나호", line: "Costa Cruises", depart: "2026-11-10", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: ["로마", "제노바", "마르세유", "바르셀로나", "팔마", "나폴리"] },
  { title: "2026년 11월 25일 서부지중해 크루즈 - 코스타 토스카나호", ship: "코스타 토스카나호", line: "Costa Cruises", depart: "2026-11-25", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: ["로마", "사보나", "마르세유", "바르셀로나", "마요르카", "팔레르모", "로마"] },
  { title: "2026년 12월 9일 서부지중해 크루즈 - 코스타 토스카나호", ship: "코스타 토스카나호", line: "Costa Cruises", depart: "2026-12-09", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: ["로마", "사보나", "마르세유", "바르셀로나", "마요르카", "팔레르모", "로마"] },
  { title: "2027년 01월 13일 코스타 토스카나호 - 서부지중해 11일", ship: "코스타 토스카나호", line: "Costa Cruises", depart: "2027-01-13", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: ["로마", "제노바", "마르세유", "바르셀로나", "팔마", "팔레르모"] },
  { title: "2027년 02월 17일 코스타 토스카나호 - 서부지중해 11일", ship: "코스타 토스카나호", line: "Costa Cruises", depart: "2027-02-17", nights: 8, days: 11, price: 5940000, countries: WEST, itinerary: ["로마", "제노바", "마르세유", "바르셀로나", "팔마", "팔레르모"] },
  { title: "2026년 06월 11일 동부지중해 크루즈 - RCL [익스플로러호]", ship: "RCL 익스플로러호", line: "Royal Caribbean", depart: "2026-06-11", nights: 8, days: 11, price: 0, countries: ["이탈리아", "그리스", "크로아티아"], itinerary: ["라베나", "산토리니", "미코노스", "아테네", "스플리트", "라베나"] },
  { title: "2026년 07월 09일 동부지중해 크루즈 - RCL [익스플로러호]", ship: "RCL 익스플로러호", line: "Royal Caribbean", depart: "2026-07-09", nights: 8, days: 11, price: 5940000, countries: ["이탈리아", "그리스", "크로아티아"], itinerary: ["라베나", "산토리니", "아테네", "미코노스", "스플리트", "라베나"] },
  { title: "[프라임] 2027년 5월 9일 동부지중해 15일 - 인첸티드 프린세스호", ship: "프린세스 인첸티드프린세스호", line: "Princess Cruises", depart: "2027-05-09", nights: 12, days: 15, price: 8940000, countries: ["이탈리아", "크로아티아", "몬테네그로", "그리스", "터키"], itinerary: [], description: "프리미엄 선사 프린세스 크루즈 인첸티드프린세스호(145,000톤 / 2021년 첫 취항). 프리미엄 발코니 객실 이용. 선착순 할인 80만원." },
  { title: "2027년 5월 21일 북유럽 피오르드 크루즈 10일 - 코스타 디아데마", ship: "코스타 디아데마", line: "Costa Cruises", depart: "2027-05-21", nights: 7, days: 10, price: 5940000, countries: ["덴마크", "노르웨이", "독일"], itinerary: [], description: "코스타 디아데마(13만톤 / 2014년 첫 운항). 내측객실 기준." },
];

// 선박별 대표 이미지 (public/ships/)
function thumbFor(ship) {
  if (ship.includes("씨뷰")) return "/ships/msc-seaview.png";
  if (ship.includes("스메랄다")) return "/ships/costa-smeralda.png";
  if (ship.includes("토스카나")) return "/ships/costa-toscana.png";
  return undefined;
}

const voyages = raw.map((r) => {
  const v = {
    title: r.title,
    region: "유럽",
    shipName: r.ship,
    line: r.line,
    departDate: r.depart,
    arriveDate: arrive(r.depart, r.days),
    nights: r.nights,
    days: r.days,
    priceFrom: r.price,
    countries: r.countries,
    itinerary: r.itinerary,
  };
  const thumb = thumbFor(r.ship);
  if (thumb) v.thumbnail = thumb;
  if (r.flight) v.flight = r.flight;
  if (r.description) v.description = r.description;
  return v;
});

// 기존 제목 수집 → 중복 건너뜀
const snap = await getDocs(collection(db, "voyages"));
const existing = new Set(snap.docs.map((d) => d.data().title));

let added = 0;
for (const v of voyages) {
  if (existing.has(v.title)) {
    console.log("건너뜀(이미 있음):", v.title);
    continue;
  }
  await addDoc(collection(db, "voyages"), v);
  console.log("추가:", v.title);
  added++;
}
console.log(`\n✅ ${added}건 추가 (전체 ${voyages.length}건 중)`);
process.exit(0);
