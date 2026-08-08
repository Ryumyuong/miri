// 모든 상품(voyages)에서 "선박 TAX 및 항구 이용료", "크루즈 선내 팁"을 불포함→포함으로 이동.
// 커스텀 값이 없는(빈) 상품은 기본값(코드의 DEFAULT_*)을 그대로 쓰므로 건드리지 않는다.
// 실행: node scripts/fix-included-excluded.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const MOVE = ["선박 TAX 및 항구 이용료", "크루즈 선내 팁"];

const snap = await getDocs(collection(db, "voyages"));
let changed = 0, skipped = 0;
for (const d of snap.docs) {
  const v = d.data();
  const inc = Array.isArray(v.included) ? v.included : [];
  const exc = Array.isArray(v.excluded) ? v.excluded : [];
  // 커스텀 값이 전혀 없으면 기본값 사용 → 그대로 둠
  if (inc.length === 0 && exc.length === 0) { skipped++; continue; }

  const needsMove = exc.some((x) => MOVE.includes(x)) || MOVE.some((m) => !inc.includes(m));
  if (!needsMove) { skipped++; continue; }

  const newExcluded = exc.filter((x) => !MOVE.includes(x));
  const newIncluded = [...inc, ...MOVE.filter((m) => !inc.includes(m))];
  await updateDoc(doc(db, "voyages", d.id), { included: newIncluded, excluded: newExcluded });
  changed++;
  console.log(`✔ ${v.title?.slice(0, 30) ?? d.id}`);
}
console.log(`\n✅ 이동 완료: ${changed}건 수정 · ${skipped}건 유지(기본값 사용/이미 반영)`);
process.exit(0);
