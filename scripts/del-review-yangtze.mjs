// 장강 후기 삭제. 실행: node scripts/del-review-yangtze.mjs
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

const snap = await getDocs(collection(db, "reviews"));
let removed = 0;
for (const d of snap.docs) {
  const r = d.data();
  if (r.category === "장강크루즈" || r.title === "장강의 절경을 만끽한 여행") {
    await deleteDoc(doc(db, "reviews", d.id));
    console.log("삭제:", r.title);
    removed++;
  }
}
console.log(`\n✅ 장강 후기 ${removed}건 삭제`);
process.exit(0);
