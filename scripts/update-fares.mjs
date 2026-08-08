// 누락 일정 추가 + 요금문의(가격 0) 항목 마감 처리. 실행: node scripts/update-fares.mjs
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
const arrive = (depart, days) => addDays(depart, days - 1);
const WEST = ["이탈리아", "스페인", "프랑스"];

// 추가할 신규 일정 (모두 요금문의 → 마감)
const newOnes = [
  { title: "2026년 05월 15일 서부 지중해 크루즈 - MSC [씨뷰호]", ship: "MSC 씨뷰호", line: "MSC Cruises", depart: "2026-05-15", nights: 8, days: 11, countries: WEST, itinerary: [], flight: "카타르항공 (QR)", thumbnail: "/ships/msc-seaview.png" },
  { title: "2026년 05월 20일 ☆발코니UP☆ 서부지중해 8박 11일 [Costa Smeralda]", ship: "코스타 스메랄다호", line: "Costa Cruises", depart: "2026-05-20", nights: 8, days: 11, countries: WEST, itinerary: ["로마", "사보나", "마르세유", "바르셀로나", "이비자", "팔레르모", "로마"], thumbnail: "/ships/costa-smeralda.png" },
  { title: "2026년 06월 05일 서부 지중해 크루즈 - MSC [씨뷰호]", ship: "MSC 씨뷰호", line: "MSC Cruises", depart: "2026-06-05", nights: 8, days: 11, countries: WEST, itinerary: [], flight: "카타르항공 (QR)", thumbnail: "/ships/msc-seaview.png" },
];

// 마감 처리할 출발일 (요금문의 항목)
const CLOSED_DATES = new Set(["2026-05-15", "2026-05-20", "2026-06-05", "2026-06-11", "2026-06-16"]);

const snap = await getDocs(collection(db, "voyages"));
const existing = new Set(snap.docs.map((d) => d.data().title));

// 1) 신규 추가
let added = 0;
for (const r of newOnes) {
  if (existing.has(r.title)) { console.log("건너뜀(이미 있음):", r.title); continue; }
  await addDoc(collection(db, "voyages"), {
    title: r.title, region: "유럽", shipName: r.ship, line: r.line,
    departDate: r.depart, arriveDate: arrive(r.depart, r.days),
    nights: r.nights, days: r.days, priceFrom: 0, statusManual: "마감",
    countries: r.countries, itinerary: r.itinerary,
    thumbnail: r.thumbnail, ...(r.flight ? { flight: r.flight } : {}),
  });
  console.log("추가(마감):", r.title);
  added++;
}

// 2) 기존 항목 중 요금문의 출발일 → 마감 + priceFrom 0
const snap2 = await getDocs(collection(db, "voyages"));
let closed = 0;
for (const d of snap2.docs) {
  const v = d.data();
  if (CLOSED_DATES.has(v.departDate) && (v.statusManual !== "마감" || (v.priceFrom ?? 0) !== 0)) {
    const patch = { priceFrom: 0, statusManual: "마감" };
    // 06-16 코스타 스메랄다 썸네일 보강
    if (v.departDate === "2026-06-16" && !v.thumbnail) patch.thumbnail = "/ships/costa-smeralda.png";
    await updateDoc(doc(db, "voyages", d.id), patch);
    console.log("마감 처리:", v.title);
    closed++;
  }
}

// 3) 2026-12-09 코스타 토스카나 → 1개는 진행중(예약 중), 1개는 마감
const snap3 = await getDocs(collection(db, "voyages"));
const dec9 = snap3.docs.filter((d) => d.data().departDate === "2026-12-09");
const TOSCANA_ITIN = ["로마", "사보나", "마르세유", "바르셀로나", "마요르카", "팔레르모", "로마"];

// 기존 12-09(가격본) → 예약 중 + 가격 복원
for (const d of dec9) {
  const v = d.data();
  if (v.statusManual !== "마감") {
    await updateDoc(doc(db, "voyages", d.id), { statusManual: "예약 중", priceFrom: 5940000 });
    console.log("진행중(예약 중) 처리:", v.title);
  }
}

// 마감 12-09 없으면 추가
if (!dec9.some((d) => d.data().statusManual === "마감")) {
  await addDoc(collection(db, "voyages"), {
    title: "2026년 12월 9일 서부지중해 크루즈 - 코스타 토스카나호",
    region: "유럽", shipName: "코스타 토스카나호", line: "Costa Cruises",
    departDate: "2026-12-09", arriveDate: arrive("2026-12-09", 11),
    nights: 8, days: 11, priceFrom: 0, statusManual: "마감",
    countries: WEST, itinerary: TOSCANA_ITIN, thumbnail: "/ships/costa-toscana.png",
  });
  console.log("추가(마감): 2026년 12월 9일 코스타 토스카나호");
}

console.log(`\n✅ 신규 ${added}건 추가, 마감 ${closed}건 처리, 12-09 분리 완료`);
process.exit(0);
