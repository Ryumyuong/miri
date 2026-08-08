import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const vs = await getDocs(collection(db, "voyages"));
console.log("=== 코스타 토스카나 상품 ===");
vs.docs.forEach((d) => {
  const v = d.data();
  if (v.title?.includes("토스카나") && v.title?.includes("11월 25")) {
    console.log("ID:", d.id);
    console.log("제목:", v.title);
    console.log("출발:", v.departDate, "귀국:", v.arriveDate, "박:", v.nights, "일:", v.days);
    console.log("기존 itineraryDays:", (v.itineraryDays?.length ?? 0), "일차");
  }
});

console.log("\n=== 관광 카드(portCards) ===");
const pc = await getDocs(collection(db, "portCards"));
pc.docs.forEach((d) => {
  const c = d.data();
  console.log(`${d.id} | ${c.name} | ${c.country} | ${c.region}`);
});
process.exit(0);
