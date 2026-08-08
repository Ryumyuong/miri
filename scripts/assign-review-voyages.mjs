// 후기 9건을 상품 묶음(voyageId)에 연결. 실행: node scripts/assign-review-voyages.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const vs = await getDocs(collection(db, "voyages"));
const voyages = vs.docs.map((d) => ({ id: d.id, ...d.data() }));
const norm = (s) => (s ?? "").replace(/\s/g, "");
const find = (pred) => voyages.find(pred);

const arabia = find((v) => v.region === "중동" || norm(v.title).includes("아라비아해"));
const costa = find((v) => norm(v.title).includes("토스카나") && norm(v.title).includes("서부지중해"));
const msc = find((v) => norm(v.title).includes("씨뷰"));

console.log("아라비아해 →", arabia?.id, arabia?.title);
console.log("코스타 토스카나 서부 →", costa?.id, costa?.title);
console.log("MSC 씨뷰 서부 →", msc?.id, msc?.title);
if (!arabia || !costa || !msc) { console.error("대상 상품을 찾지 못함"); process.exit(1); }

// 후기 제목 → voyageId 매핑
const map = {
  // 서부지중해 3건: 코스타 2 / MSC 1
  "다음에 또 크루즈를 이용하게 된다면 미리크루즈 최성욱 인솔자님과 함께 여행 하기를 희망한다.": costa.id,
  "서부지중해 크루즈, 기대 이상의 매우 만족한 여행 이었습니다!": costa.id,
  "서부지중해 크루즈 여행 기대에 부풀어서 오게 되었는데...": msc.id,
  // 아라비아해 6건
  "크루즈여행을 떠난다는 것은 그 자체로 큰 선물이었습니다.": arabia.id,
  "정말 즐거운 여행이었습니다.": arabia.id,
  "홈쇼핑 여행상품을 보다 알게된 늘곁애라이프온투어 미리크루즈 상품을 접하고": arabia.id,
  "안녕하세요~ 저희 부부는 2026년 1/16~1/25일까지 아라비아 크루즈를 다녀왔습니다.": arabia.id,
  "평생 기억에 남을 미리크루즈 중동 크루즈여행을 다녀왔어요~": arabia.id,
  "미리크루즈로 아라비아여행": arabia.id,
};

const rs = await getDocs(collection(db, "reviews"));
let n = 0;
for (const d of rs.docs) {
  const t = d.data().title;
  if (map[t]) {
    await updateDoc(doc(db, "reviews", d.id), { voyageId: map[t] });
    n++;
    console.log("연결:", `${map[t].slice(0, 6)}… ← ${t.slice(0, 20)}`);
  }
}
console.log(`\n✅ ${n}건 voyageId 연결 완료`);
process.exit(0);
