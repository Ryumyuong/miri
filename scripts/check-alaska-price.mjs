import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const vs = await getDocs(collection(db, "voyages"));
const rows = [];
vs.docs.forEach((d) => {
  const v = d.data();
  if (v.title && (v.title.includes("알래스카") || v.title.includes("로얄") || v.title.includes("퀀텀"))) {
    rows.push({ id: d.id, title: v.title, departDate: v.departDate, status: v.status, priceFrom: v.priceFrom, roomPrices: v.roomPrices });
  }
});
rows.sort((a, b) => (a.departDate || "").localeCompare(b.departDate || ""));
rows.forEach((v) => {
  console.log("id:", v.id);
  console.log("  title:", JSON.stringify(v.title));
  console.log("  departDate:", v.departDate, "| status:", v.status);
  console.log("  priceFrom:", v.priceFrom, "| roomPrices:", JSON.stringify(v.roomPrices));
  console.log("");
});
console.log("총", rows.length, "건");
process.exit(0);
