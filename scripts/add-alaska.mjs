// 미주·알래스카 운항 일정 일괄 추가. 실행: node scripts/add-alaska.mjs
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
const arrive = (depart, days) => addDays(depart, days - 1);

const VANCOUVER = ["캐나다", "미국"];
const SEATTLE = ["미국", "캐나다"];

const raw = [
  { title: "2026년 7월 19일 벤쿠버+알래스카 크루즈 11일 - [에메랄드 프린세스호]", ship: "에메랄드 프린세스호", line: "Princess Cruises", depart: "2026-07-19", nights: 10, days: 11, price: 5940000, countries: VANCOUVER, itinerary: ["밴쿠버", "알래스카"], flight: "티웨이항공 (TW531)", code: "USJNU11627525120476056", description: "벤쿠버/알래스카 - 프리미엄 선사 프린세스 크루즈 '에메랄드 프린세스호'" },
  { title: "2026년 08월 09일 벤쿠버+알래스카 크루즈 11일 - [에메랄드 프린세스호]", ship: "에메랄드 프린세스호", line: "Princess Cruises", depart: "2026-08-09", nights: 8, days: 11, price: 5940000, countries: VANCOUVER, itinerary: ["밴쿠버", "알래스카"], flight: "티웨이항공 (TW531)", code: "USJNU11627525120576058", description: "벤쿠버/알래스카 - 프리미엄 선사 프린세스 크루즈 '에메랄드 프린세스호'" },
  { title: "2026년 08월 20일 [로얄캐리비안 보이저호] 알래스카 크루즈 8박 10일", ship: "보이저 오브 더 시즈", line: "Royal Caribbean", depart: "2026-08-20", nights: 8, days: 10, price: 5940000, countries: SEATTLE, itinerary: ["시애틀", "주노", "스캐그웨이", "엔디콧암&도스빙하", "빅토리아", "시애틀"], flight: "델타항공 (DL196)", code: "CA11627526020376066", description: "Royal Caribbean Voyager of the Seas 알래스카크루즈 (시애틀/주노/스캐그웨이/엔디콧암&도스빙하/빅토리아/시애틀)" },
  { title: "2026년 09월 03일 [로얄캐리비안 보이저호] 알래스카 크루즈 8박 10일", ship: "보이저 오브 더 시즈", line: "Royal Caribbean", depart: "2026-09-03", nights: 8, days: 10, price: 5940000, countries: SEATTLE, itinerary: ["시애틀", "주노", "스캐그웨이", "엔디콧암&도스빙하", "빅토리아", "시애틀"], flight: "델타항공 (DL196)", code: "CA11627526020376067", description: "Royal Caribbean Voyager of the Seas 알래스카크루즈 (시애틀/주노/스캐그웨이/엔디콧암&도스빙하/빅토리아/시애틀)" },
  { title: "2027년 7월 11일 벤쿠버+알래스카 크루즈 11일 - [에메랄드 프린세스호]", ship: "에메랄드 프린세스호", line: "Princess Cruises", depart: "2027-07-11", nights: 9, days: 11, price: 6440000, countries: VANCOUVER, itinerary: ["밴쿠버", "알래스카"], flight: "티웨이항공 (TW531)", code: "USJNU11627526052976083", description: "벤쿠버/알래스카 - 프리미엄 선사 프린세스 크루즈 '에메랄드 프린세스호'" },
  { title: "2027년 08월 01일 벤쿠버+알래스카 크루즈 11일 - [에메랄드 프린세스호]", ship: "에메랄드 프린세스호", line: "Princess Cruises", depart: "2027-08-01", nights: 9, days: 11, price: 6940000, countries: VANCOUVER, itinerary: ["밴쿠버", "알래스카"], flight: "티웨이항공 (TW531)", code: "USJNU11627526052976084", description: "벤쿠버/알래스카 - 프리미엄 선사 프린세스 크루즈 '에메랄드 프린세스호'" },
  { title: "2027년 08월 22일 [로얄캐리비안 퀀텀호] 알래스카 크루즈 8박 10일", ship: "퀀텀 오브 더 시즈", line: "Royal Caribbean", depart: "2027-08-22", nights: 8, days: 10, price: 6440000, countries: SEATTLE, itinerary: ["시애틀", "싯카", "스캐그웨이", "주노", "빅토리아", "시애틀"], flight: "대한항공 (KE041)", code: "CA11627526051576082", description: "Royal Caribbean Quantum of the Seas호 알래스카크루즈 (시애틀/싯카/스캐그웨이/주노/빅토리아/시애틀)" },
];

const voyages = raw.map((r) => ({
  title: r.title,
  region: "미주·알래스카",
  shipName: r.ship,
  line: r.line,
  departDate: r.depart,
  arriveDate: arrive(r.depart, r.days),
  nights: r.nights,
  days: r.days,
  priceFrom: r.price,
  countries: r.countries,
  itinerary: r.itinerary,
  flight: r.flight,
  code: r.code,
  description: r.description,
}));

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
