import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI",
  authDomain: "miri-6246c.firebaseapp.com",
  projectId: "miri-6246c",
  storageBucket: "miri-6246c.firebasestorage.app",
  messagingSenderId: "143650281515",
  appId: "1:143650281515:web:b459ea9481f2baeea7b26e",
});
const db = getFirestore(app);

const data = {
  shipCards: [
    { id: "s1", name: "MSC Seaview", line: "MSC 크루즈", capacity: 5179, description: "지중해를 누비는 대형 럭셔리 크루즈", usedByCount: 5 },
    { id: "s2", name: "Costa Serena", line: "코스타 크루즈", capacity: 3780, description: "이탈리아 감성의 클래식 크루즈", usedByCount: 4 },
  ],
  payments: [
    { id: "pay1", customerName: "홍길동", voyageTitle: "유럽 지중해 - MSC Seaview", amount: 5940000, paid: 5940000, status: "결제완료", date: "2026-06-10" },
    { id: "pay2", customerName: "김미리", voyageTitle: "중동 - Costa Serena", amount: 4100000, paid: 1000000, status: "부분결제", date: "2026-06-12" },
  ],
  alerts: [
    { id: "a1", level: "danger", tag: "D-150", message: "유럽 지중해 크루즈 - 여권 제출 기한 도래" },
    { id: "a2", level: "warning", tag: "D-120", message: "중동 크루즈 - 잔금 납부 안내 필요" },
    { id: "a3", level: "danger", tag: "여권 만료", message: "홍길동 고객 - 여권 만료 6개월 미만" },
    { id: "a4", level: "warning", tag: "미제출", message: "김미리 고객 - 여권 정보 미제출" },
  ],
};

for (const [col, items] of Object.entries(data)) {
  const snap = await getDocs(collection(db, col));
  if (!snap.empty) {
    console.log(`${col}: 이미 ${snap.size}건, 건너뜀`);
    continue;
  }
  for (const it of items) {
    const { id, ...rest } = it;
    await setDoc(doc(db, col, id), rest);
  }
  console.log(`✅ ${col}: ${items.length}건 시드`);
}
process.exit(0);
