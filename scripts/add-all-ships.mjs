// 상품에 쓰인 선박들(전 지역) 카드 일괄 생성. 실행: node scripts/add-all-ships.mjs
// 이름이 이미 존재하면 건너뜀. 대표사진은 해당 선박 상품의 썸네일을 사용.
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

// 선박 스펙 (톤수·취항연도·정원은 널리 알려진 값 기준)
const SPECS = {
  "MSC 씨뷰호": { line: "MSC Cruises", capacity: 4140, desc: "MSC 크루즈의 씨뷰호 (153,516톤 / 2018년 취항 / 승객 약 4,140명). 지중해를 누비는 대형 리조트형 선박." },
  "코스타 토스카나호": { line: "Costa Cruises", capacity: 5322, desc: "코스타 크루즈의 토스카나호 (185,010톤 / 2021년 취항 / 승객 약 5,322명). LNG 추진 친환경 최신 플래그십." },
  "MSC 벨리시마호": { line: "MSC Cruises", capacity: 4488, desc: "MSC 크루즈의 벨리시마호 (171,598톤 / 2019년 취항 / 승객 약 4,488명). 화려한 시설의 대형 선박." },
  "코스타 스메랄다호": { line: "Costa Cruises", capacity: 5322, desc: "코스타 크루즈의 스메랄다호 (185,010톤 / 2019년 취항 / 승객 약 5,322명). LNG 추진 플래그십, 서부지중해 크루즈." },
  "프린세스 인첸티드프린세스호": { line: "Princess Cruises", capacity: 3660, desc: "프린세스 크루즈의 인첸티드 프린세스호 (145,281톤 / 2021년 취항 / 승객 약 3,660명). 프리미엄 발코니 객실." },
  "로얄캐리비안 네비게이터호": { line: "Royal Caribbean", capacity: 3386, desc: "로얄캐리비안의 네비게이터 오브 더 시즈 (139,999톤 / 2002년 취항 / 승객 약 3,386명). 동남아 크루즈." },
  "RCL 익스플로러호": { line: "Royal Caribbean", capacity: 3286, desc: "로얄캐리비안의 익스플로러 오브 더 시즈 (137,308톤 / 2000년 취항 / 승객 약 3,286명 / 승무원 약 1,185명). 동부지중해 크루즈." },
  "코스타 세레나호": { line: "Costa Cruises", capacity: 3780, desc: "코스타 크루즈의 세레나호 (114,500톤 / 2007년 취항 / 승객 약 3,780명). 동북아 크루즈." },
  "코스타 디아데마": { line: "Costa Cruises", capacity: 4947, desc: "코스타 크루즈의 디아데마 (132,500톤 / 2014년 취항 / 승객 약 4,947명). 북유럽 피오르드 크루즈." },
  "MSC World Europa": { line: "MSC Cruises", capacity: 6762, desc: "MSC 크루즈의 월드 유로파 (215,863톤 / 2022년 취항 / 승객 약 6,762명). LNG 추진 초대형 플래그십, 중동 크루즈." },
};

// 상품에서 선박별 대표 썸네일 수집
const vs = await getDocs(collection(db, "voyages"));
const thumbOf = {};
vs.docs.forEach((d) => {
  const v = d.data();
  if (v.shipName && v.thumbnail && !thumbOf[v.shipName]) thumbOf[v.shipName] = v.thumbnail;
});

const cards = await getDocs(collection(db, "shipCards"));
const existing = new Set(cards.docs.map((d) => d.data().name));

let added = 0;
for (const [name, s] of Object.entries(SPECS)) {
  if (existing.has(name)) {
    console.log("건너뜀(이미 있음):", name);
    continue;
  }
  const card = {
    name,
    line: s.line,
    capacity: s.capacity,
    description: s.desc,
    usedByCount: 0,
  };
  if (thumbOf[name]) card.imageUrl = thumbOf[name];
  await addDoc(collection(db, "shipCards"), card);
  console.log("추가:", name, card.imageUrl ? "(사진O)" : "(사진X)");
  added++;
}
console.log(`\n✅ 선박 카드 ${added}건 추가`);
process.exit(0);
