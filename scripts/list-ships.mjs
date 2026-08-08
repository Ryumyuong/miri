import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const vs = await getDocs(collection(db, "voyages"));
const ships = new Map();
vs.docs.forEach((d) => {
  const v = d.data();
  if (!v.shipName) return;
  if (!ships.has(v.shipName)) ships.set(v.shipName, { line: v.line, region: v.region, thumb: v.thumbnail, count: 0 });
  ships.get(v.shipName).count++;
});
const cards = await getDocs(collection(db, "shipCards"));
const cardNames = new Set(cards.docs.map((d) => d.data().name));
console.log("=== 상품에 쓰인 선박 ===");
for (const [name, info] of ships) {
  console.log(`${cardNames.has(name) ? "✓카드있음" : "✗카드없음"} | ${name} | ${info.line} | ${info.region} | ${info.count}건 | thumb:${info.thumb ?? "-"}`);
}
console.log("\n=== 기존 선박 카드 ===");
cards.docs.forEach((d) => console.log(d.data().name, "|", d.data().line));
process.exit(0);
