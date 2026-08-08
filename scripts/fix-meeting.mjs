import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, deleteField } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const OLD = "추후 인솔자가 개별적으로 안내드립니다.";
const vs = await getDocs(collection(db, "voyages"));
let n = 0;
for (const d of vs.docs) {
  const v = d.data();
  if (v.meetingTime === OLD) {
    await updateDoc(doc(db, "voyages", d.id), { meetingTime: deleteField() });
    n++;
    console.log("비움:", d.id);
  }
}
console.log(`완료: ${n}개 상품의 meetingTime 제거 (새 기본 문구로 노출)`);
process.exit(0);
