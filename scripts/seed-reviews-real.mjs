// 더미 후기를 실제 Firestore reviews 컬렉션에 시드 (이미지 카테고리별 지정).
// 실행: node scripts/seed-reviews-real.mjs  (제목 중복이면 건너뜀)
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

const IMG = {
  "유럽": "/reviews/europe.png",
  "중동": "/reviews/mideast.png",
  "동북아": "/reviews/northeast.png",
  "동남아": "/reviews/southeast.png",
  "미주·알래스카": "/reviews/review-2.png",
};

const reviews = [
  { author: "김**", title: "평생 잊지 못할 지중해 크루즈 여행", region: "서부지중해", ship: "Costa Smeralda", category: "유럽", content: "바르셀로나부터 로마까지, 매 순간이 감동이었습니다. 선상 서비스도 훌륭했고 기항지마다 새로운 감동을 받았습니다.", date: "2026-04-15", rating: 5, views: 234 },
  { author: "이**", title: "빙하의 장관, 알래스카 크루즈", region: "알래스카", ship: "Royal Caribbean", category: "미주·알래스카", content: "글레이셔 베이의 빙하는 정말 장관이었습니다. 크루즈에서 보는 자연의 웅장함에 압도되었어요. 가족과 함께한 최고의 여행.", date: "2026-04-10", rating: 5, views: 189 },
  { author: "박**", title: "두바이와 아부다비의 화려함", region: "아라비아해", ship: "MSC 월드유로파", category: "중동", content: "중동의 화려한 건축물과 문화를 경험할 수 있었습니다. 부르즈 칼리파, 셰이크 자이드 모스크 모두 인상적이었어요.", date: "2026-04-05", rating: 4, views: 156 },
  { author: "최**", title: "부산에서 출발하는 편리한 크루즈", region: "동북아", ship: "MSC 벨리시마", category: "동북아", content: "부산 출발이라 공항 이동 부담이 없어서 너무 좋았습니다. 일본 기항지도 알차게 다녀왔어요.", date: "2026-03-28", rating: 5, views: 178 },
  { author: "정**", title: "따뜻한 동남아 휴양 크루즈", region: "동남아", ship: "겐팅 드림", category: "동남아", content: "푸켓 해변이 정말 아름다웠습니다. 선상 수영장에서 여유롭게 쉬면서 힐링했어요.", date: "2026-03-20", rating: 4, views: 142 },
  { author: "윤**", title: "천년의 항구, 동부지중해", region: "동부지중해", ship: "Costa Serena", category: "유럽", content: "그리스 산토리니의 노을은 평생 잊지 못할 거예요. 일정 내내 행복했습니다.", date: "2026-03-08", rating: 5, views: 167 },
  { author: "한**", title: "잊지 못할 신혼 크루즈", region: "서부지중해", ship: "MSC Seaview", category: "유럽", content: "신혼여행으로 다녀왔는데 두 사람 모두 대만족이었습니다. 다음에 또 가고 싶어요.", date: "2026-02-28", rating: 5, views: 203 },
];

const snap = await getDocs(collection(db, "reviews"));
const existing = new Set(snap.docs.map((d) => d.data().title));

let added = 0;
for (const r of reviews) {
  if (existing.has(r.title)) {
    console.log("건너뜀(이미 있음):", r.title);
    continue;
  }
  const doc = { ...r, imageUrl: IMG[r.category] ?? "", createdAt: `${r.date}T09:00:00` };
  await addDoc(collection(db, "reviews"), doc);
  console.log("추가:", r.category, "|", r.title);
  added++;
}
console.log(`\n✅ 후기 ${added}건 Firestore 추가`);
process.exit(0);
