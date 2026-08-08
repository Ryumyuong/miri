import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const rs = await getDocs(collection(db, "reviews"));
console.log("=== reviews ===");
rs.docs.forEach((d) => {
  const r = d.data();
  console.log(`${d.id} | region:[${r.region ?? ""}] cat:[${r.category ?? ""}] voyageId:[${r.voyageId ?? ""}] | ${r.title}`);
});

console.log("\n=== 상품 지역 목록 (voyages) ===");
const vs = await getDocs(collection(db, "voyages"));
const regions = new Set();
vs.docs.forEach((d) => regions.add(d.data().region));
console.log([...regions].join(" / "));
process.exit(0);
