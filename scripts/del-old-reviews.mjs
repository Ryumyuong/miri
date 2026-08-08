// 방금 등록한 9개 실제 후기만 남기고 나머지(더미) 삭제. 실행: node scripts/del-old-reviews.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const KEEP = new Set([
  "다음에 또 크루즈를 이용하게 된다면 미리크루즈 최성욱 인솔자님과 함께 여행 하기를 희망한다.",
  "서부지중해 크루즈, 기대 이상의 매우 만족한 여행 이었습니다!",
  "서부지중해 크루즈 여행 기대에 부풀어서 오게 되었는데...",
  "크루즈여행을 떠난다는 것은 그 자체로 큰 선물이었습니다.",
  "정말 즐거운 여행이었습니다.",
  "홈쇼핑 여행상품을 보다 알게된 늘곁애라이프온투어 미리크루즈 상품을 접하고",
  "안녕하세요~ 저희 부부는 2026년 1/16~1/25일까지 아라비아 크루즈를 다녀왔습니다.",
  "평생 기억에 남을 미리크루즈 중동 크루즈여행을 다녀왔어요~",
  "미리크루즈로 아라비아여행",
]);

const snap = await getDocs(collection(db, "reviews"));
let del = 0, kept = 0;
for (const d of snap.docs) {
  const t = d.data().title;
  if (KEEP.has(t)) { kept++; continue; }
  await deleteDoc(doc(db, "reviews", d.id));
  del++;
  console.log("삭제:", (t ?? "").slice(0, 30));
}
console.log(`\n✅ 삭제 ${del}건 / 유지 ${kept}건`);
process.exit(0);
