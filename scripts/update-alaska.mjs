// 미주·알래스카: 추가 상품 등록 + 선박별 대표사진(썸네일) 지정.
// 실행: node scripts/update-alaska.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

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

// 선박명 → 대표사진
const SHIP_THUMB = {
  "에메랄드 프린세스호": "/ships/emerald-princess.png",
  "보이저 오브 더 시즈": "/ships/voyager-of-the-seas.png",
  "퀀텀 오브 더 시즈": "/ships/quantum-of-the-seas.jpg",
};

// 추가 상품
const newRaw = [
  { title: "2027년 06월 03일 [로얄캐리비안 보이저호] 알래스카 크루즈 8박 10일", ship: "보이저 오브 더 시즈", line: "Royal Caribbean", depart: "2027-06-03", nights: 8, days: 10, price: 5940000, countries: ["미국", "캐나다"], itinerary: ["시애틀", "주노", "스캐그웨이", "엔디콧암&도스빙하", "빅토리아", "시애틀"], flight: "대한항공 (KE041)", code: "CA11627526051576080", description: "Royal Caribbean Voyager of the Seas 알래스카크루즈 (시애틀/주노/스캐그웨이/엔디콧암&도스빙하/빅토리아/시애틀)" },
];

const newVoyages = newRaw.map((r) => ({
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
  thumbnail: SHIP_THUMB[r.ship],
}));

const snap = await getDocs(collection(db, "voyages"));
const existing = new Set(snap.docs.map((d) => d.data().title));

// 1) 신규 추가
for (const v of newVoyages) {
  if (existing.has(v.title)) {
    console.log("건너뜀(이미 있음):", v.title);
  } else {
    await addDoc(collection(db, "voyages"), v);
    console.log("추가:", v.title);
  }
}

// 2) 선박별 대표사진 지정 (기존 문서)
let updated = 0;
for (const d of snap.docs) {
  const data = d.data();
  const thumb = SHIP_THUMB[data.shipName];
  if (thumb && data.thumbnail !== thumb) {
    await updateDoc(doc(db, "voyages", d.id), { thumbnail: thumb });
    console.log("대표사진:", data.title);
    updated++;
  }
}
console.log(`\n✅ 대표사진 ${updated}건 지정`);
process.exit(0);
