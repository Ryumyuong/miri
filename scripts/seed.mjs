// Firestore 연결 검증 + voyages 샘플 시드 (1회용)
// 실행: node scripts/seed.mjs
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI",
  authDomain: "miri-6246c.firebaseapp.com",
  projectId: "miri-6246c",
  storageBucket: "miri-6246c.firebasestorage.app",
  messagingSenderId: "143650281515",
  appId: "1:143650281515:web:b459ea9481f2baeea7b26e",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const voyages = [
  { id: "v1", title: "2026년 05월 14일 [로얄캐리비안 보이저호] 알래스카 크루즈 8박 10일", region: "미주·알래스카", shipName: "Voyager of the Seas", line: "Royal Caribbean", departDate: "2026-05-14", arriveDate: "2026-05-23", countries: ["미국", "캐나다"], itinerary: ["시애틀", "주노", "스캐그웨이", "케치칸", "빅토리아", "시애틀"], nights: 8, days: 10, priceFrom: 4290000, status: "예약 가능", dDay: 7, reservedCount: 26, passportDone: 20, passportPending: 6, contractCount: 23 },
  { id: "v2", title: "2026년 06월 16일 ☆발코니UP☆서부지중해 8박 11일 [Costa Smeralda]", region: "유럽", shipName: "Costa Smeralda", line: "Costa Cruises", departDate: "2026-06-16", arriveDate: "2026-06-26", countries: ["이탈리아", "프랑스", "스페인"], itinerary: ["로마", "제노아", "마르세유", "바르셀로나", "칼리아리", "나폴리", "로마"], nights: 8, days: 11, priceFrom: 5940000, status: "출발 확정", dDay: 40, reservedCount: 13, passportDone: 10, passportPending: 3, contractCount: 11 },
  { id: "v3", title: "2026년 07월 13일 동남아 크루즈 - Resort World [겐팅 드림 크루즈]", region: "동남아", shipName: "Genting Dream", line: "Resorts World Cruises", departDate: "2026-07-13", arriveDate: "2026-07-20", countries: ["싱가포르", "말레이시아", "태국"], itinerary: ["싱가포르", "페낭", "푸켓", "랑카위", "싱가포르"], nights: 7, days: 8, priceFrom: 2490000, status: "예약 가능", dDay: 67, reservedCount: 27, passportDone: 21, passportPending: 6, contractCount: 24 },
  { id: "v4", title: "부산출발 2026년 08월 16일 동북아크루즈 - MSC [벨리시마호]", region: "동북아", shipName: "MSC Bellissima", line: "MSC Cruises", departDate: "2026-08-16", arriveDate: "2026-08-21", countries: ["대한민국", "일본"], itinerary: ["부산", "후쿠오카", "나가사키", "부산"], dDay: 56, nights: 5, days: 6, priceFrom: 1890000, status: "출발 확정", reservedCount: 11, passportDone: 8, passportPending: 3, contractCount: 9 },
  { id: "v5", title: "장강삼협 리버 크루즈 9박 10일", region: "리버 크루즈", shipName: "빅토리아 셀레네", line: "Victoria Cruises", departDate: "2026-10-08", arriveDate: "2026-10-17", countries: ["중국"], itinerary: ["충칭", "펑두", "삼협댐", "의창"], dDay: 109, nights: 9, days: 10, priceFrom: 3200000, status: "예약 가능", reservedCount: 20, passportDone: 16, passportPending: 4, contractCount: 18 },
  { id: "v6", title: "2026년 12월 4일 아라비아해 크루즈 - [MSC월드유로파]", region: "중동", shipName: "MSC World Europa", line: "MSC Cruises", departDate: "2026-12-04", arriveDate: "2026-12-13", countries: ["아랍에미리트", "카타르"], itinerary: ["두바이", "아부다비", "도하", "두바이"], dDay: 166, nights: 9, days: 10, priceFrom: 4100000, status: "예약 가능", reservedCount: 22, passportDone: 17, passportPending: 5, contractCount: 19 },
];

const snap = await getDocs(collection(db, "voyages"));
if (!snap.empty) {
  console.log(`이미 voyages ${snap.size}건이 있습니다. 시드 건너뜀.`);
  process.exit(0);
}
for (const v of voyages) {
  const { id, ...rest } = v;
  await setDoc(doc(db, "voyages", id), rest);
  console.log("seeded:", id, rest.title);
}
console.log("✅ 시드 완료:", voyages.length, "건");
process.exit(0);
