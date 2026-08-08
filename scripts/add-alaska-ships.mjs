// 미주·알래스카 선박 카드 추가. 실행: node scripts/add-alaska-ships.mjs
// 이름이 이미 존재하면 건너뜀(중복 방지).
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

const ships = [
  {
    name: "에메랄드 프린세스호",
    line: "Princess Cruises",
    capacity: 3080,
    description:
      "프리미엄 선사 프린세스 크루즈의 에메랄드 프린세스호 (113,561톤 / 2007년 취항 / 승객 약 3,080명). 밴쿠버발 알래스카 빙하 크루즈에 투입되는 우아한 그랜드급 선박.",
    imageUrl: "/ships/emerald-princess.png",
    usedByCount: 4,
  },
  {
    name: "보이저 오브 더 시즈",
    line: "Royal Caribbean",
    capacity: 3114,
    description:
      "로얄캐리비안의 보이저 오브 더 시즈 (137,276톤 / 1999년 취항 / 승객 약 3,114명). 아이스링크·록클라이밍 등 다채로운 시설을 갖춘 시애틀발 알래스카 크루즈 선박.",
    imageUrl: "/ships/voyager-of-the-seas.png",
    usedByCount: 3,
  },
  {
    name: "퀀텀 오브 더 시즈",
    line: "Royal Caribbean",
    capacity: 4180,
    description:
      "로얄캐리비안의 최신 스마트십 퀀텀 오브 더 시즈 (168,666톤 / 2014년 취항 / 승객 약 4,180명). 노스스타·리플라이드 등 혁신 시설의 시애틀발 알래스카 크루즈 선박.",
    imageUrl: "/ships/quantum-of-the-seas.jpg",
    usedByCount: 2,
  },
];

const snap = await getDocs(collection(db, "shipCards"));
const existing = new Set(snap.docs.map((d) => d.data().name));

let added = 0;
for (const s of ships) {
  if (existing.has(s.name)) {
    console.log("건너뜀(이미 있음):", s.name);
    continue;
  }
  await addDoc(collection(db, "shipCards"), s);
  console.log("추가:", s.name);
  added++;
}
console.log(`\n✅ 선박 카드 ${added}건 추가`);
process.exit(0);
