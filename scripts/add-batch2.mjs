// 2차 배치: 중동·동북아·동남아 추가 + 기존(12-04, 08-16) 갱신. 실행: node scripts/add-batch2.mjs
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

function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
const arrive = (depart, days) => (depart ? addDays(depart, days - 1) : "");

// 신규 추가 항목 (closed=true 면 요금문의→마감)
const newOnes = [
  { title: "*부산출발* 2026년 05월 27일 동북아크루즈 - 코스타 [세레나호]", region: "동북아", ship: "코스타 세레나호", line: "Costa Cruises", depart: "2026-05-27", nights: 5, days: 6, countries: ["대한민국", "일본", "대만"], itinerary: ["부산", "구마모토", "기륭", "인천"], closed: true },
  { title: "*부산출발* 2027년 02월 08일 동북아크루즈 - MSC [벨리시마호]", region: "동북아", ship: "MSC 벨리시마호", line: "MSC Cruises", depart: "2027-02-08", nights: 5, days: 6, price: 2970000, countries: ["대한민국", "일본", "중국"], itinerary: ["부산", "후쿠오카", "상해", "제주", "부산"] },
  { title: "*부산출발* 2027년 02월 17일 동북아크루즈 - MSC [벨리시마호]", region: "동북아", ship: "MSC 벨리시마호", line: "MSC Cruises", depart: "2027-02-17", nights: 5, days: 6, price: 2970000, countries: ["대한민국", "일본", "중국"], itinerary: ["부산", "사세보", "상해", "제주", "부산"] },
  { title: "♣부산출발 [코스타 세레나호] 한일 크루즈 3박 4일", region: "동북아", ship: "코스타 세레나호", line: "Costa Cruises", depart: "", nights: 3, days: 4, countries: ["대한민국", "일본"], itinerary: ["부산", "나가사키", "구마모토", "부산"], closed: true, description: "부산출발 일본 나가사키·구마모토 4일 크루즈. 발코니객실 기준." },
  { title: "2026년 12월 19일 동남아크루즈 - 로얄캐리비안 네비게이터호", region: "동남아", ship: "로얄캐리비안 네비게이터호", line: "Royal Caribbean", depart: "2026-12-19", nights: 5, days: 7, price: 2970000, countries: ["싱가포르", "말레이시아", "태국"], itinerary: [] },
  { title: "2027년 01월 22일 동남아크루즈 - 로얄캐리비안 네비게이터호", region: "동남아", ship: "로얄캐리비안 네비게이터호", line: "Royal Caribbean", depart: "2027-01-22", nights: 6, days: 8, price: 2970000, countries: ["싱가포르", "말레이시아", "태국"], itinerary: ["싱가포르", "페낭", "랑카위", "푸켓", "싱가포르"] },
];

// 기존(출발일로 매칭) 갱신
const updates = {
  "2026-12-04": { priceFrom: 5940000, countries: ["아랍에미리트", "카타르", "바레인"], itinerary: ["두바이", "도하", "아부다비", "써 바니야스섬", "바레인"] },
  "2026-08-16": { priceFrom: 2970000, countries: ["대한민국", "일본", "중국"], itinerary: ["부산", "상해", "후쿠오카", "부산"] },
};

const snap = await getDocs(collection(db, "voyages"));
const existing = new Set(snap.docs.map((d) => d.data().title));

let added = 0;
for (const r of newOnes) {
  if (existing.has(r.title)) { console.log("건너뜀(이미 있음):", r.title); continue; }
  const data = {
    title: r.title, region: r.region, shipName: r.ship, line: r.line,
    departDate: r.depart, arriveDate: arrive(r.depart, r.days),
    nights: r.nights, days: r.days,
    priceFrom: r.closed ? 0 : r.price,
    countries: r.countries, itinerary: r.itinerary,
    ...(r.closed ? { statusManual: "마감" } : {}),
    ...(r.description ? { description: r.description } : {}),
  };
  await addDoc(collection(db, "voyages"), data);
  console.log(`추가${r.closed ? "(마감)" : ""}:`, r.title);
  added++;
}

let updated = 0;
for (const d of snap.docs) {
  const v = d.data();
  if (updates[v.departDate]) {
    await updateDoc(doc(db, "voyages", d.id), updates[v.departDate]);
    console.log("갱신:", v.title);
    updated++;
  }
}

console.log(`\n✅ 신규 ${added}건 추가, 기존 ${updated}건 갱신`);
process.exit(0);
