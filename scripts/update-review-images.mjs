// 후기 이미지를 카테고리(지역)별로 지정. 실행: node scripts/update-review-images.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

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
  "장강크루즈": "/reviews/yangtze.png",
};

const snap = await getDocs(collection(db, "reviews"));
console.log("Firestore 후기 수:", snap.docs.length);
let updated = 0;
for (const d of snap.docs) {
  const r = d.data();
  const img = IMG[r.category];
  if (img && r.imageUrl !== img) {
    await updateDoc(doc(db, "reviews", d.id), { imageUrl: img });
    console.log("이미지 지정:", r.category, "|", r.title);
    updated++;
  }
}
console.log(`\n✅ 후기 이미지 ${updated}건 지정`);
process.exit(0);
