// 기존(오래된/중복) 선박 카드를 현재 상품 데이터에 맞게 정리.
// 상품 shipName 과 정확히 일치하는 카드만 남기고, 매칭 안 되는 옛 카드는 삭제.
// 실행: node scripts/fix-old-ships.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI",
  authDomain: "miri-6246c.firebaseapp.com",
  projectId: "miri-6246c",
  storageBucket: "miri-6246c.firebasestorage.app",
  messagingSenderId: "143650281515",
  appId: "1:143650281515:web:b459ea9481f2baeea7b26e",
});
const db = getFirestore(app);

// 상품에서 실제 사용 중인 선박명 집합
const vs = await getDocs(collection(db, "voyages"));
const usedNames = new Set(vs.docs.map((d) => d.data().shipName).filter(Boolean));

const cards = await getDocs(collection(db, "shipCards"));
let removed = 0;
for (const d of cards.docs) {
  const name = d.data().name;
  // 어떤 상품도 이 카드명을 쓰지 않으면(=옛 이름/중복) 삭제
  if (!usedNames.has(name)) {
    await deleteDoc(doc(db, "shipCards", d.id));
    console.log("삭제(상품과 매칭 안 됨):", name, "|", d.data().line);
    removed++;
  } else {
    console.log("유지:", name);
  }
}
console.log(`\n✅ 옛 카드 ${removed}건 삭제`);
process.exit(0);
