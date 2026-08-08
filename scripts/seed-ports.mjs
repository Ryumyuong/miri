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

const ports = [
  { id: "p1", name: "바르셀로나", region: "유럽", country: "스페인", description: "가우디의 건축물과 지중해의 매력이 어우러진 도시", usedByCount: 12 },
  { id: "p2", name: "두바이", region: "중동", country: "아랍에미리트", description: "미래와 전통이 공존하는 사막의 도시", usedByCount: 8 },
];

const snap = await getDocs(collection(db, "portCards"));
if (!snap.empty) {
  console.log(`이미 portCards ${snap.size}건. 건너뜀.`);
  process.exit(0);
}
for (const p of ports) {
  const { id, ...rest } = p;
  await setDoc(doc(db, "portCards", id), rest);
  console.log("seeded:", id, rest.name);
}
console.log("✅ 항구 카드 시드 완료:", ports.length, "건");
process.exit(0);
