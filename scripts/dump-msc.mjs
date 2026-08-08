import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const snap = await getDoc(doc(db, "voyages", "Cp76QACucwxDacq0HKn6"));
const v = snap.data();
console.log("=== itineraryDaysDraft (초안) ===");
const dump = (days) => {
  if (!Array.isArray(days)) return console.log("  (없음)");
  days.forEach((d, i) => {
    const blocks = d.blocks ?? [];
    console.log(`[${i + 1}일차] blocks=${blocks.length}`);
    blocks.forEach((b) => {
      const { id, type, ...rest } = b;
      const vals = Object.entries(rest)
        .filter(([, x]) => x && (typeof x !== "string" || x.trim()) && !(Array.isArray(x) && x.length === 0))
        .map(([k, x]) => `${k}=${JSON.stringify(x).slice(0, 60)}`);
      console.log(`   - ${type}${vals.length ? " | " + vals.join(", ") : " (빈 블록)"}`);
    });
  });
};
dump(v.itineraryDaysDraft);
console.log("\n=== itineraryDays (발행본) ===");
dump(v.itineraryDays);
process.exit(0);
