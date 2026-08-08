import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const vs = await getDocs(collection(db, "voyages"));
const counts = {};
vs.docs.forEach((d) => {
  const v = d.data();
  const key = JSON.stringify(v.meetingTime ?? null);
  counts[key] = (counts[key] || 0) + 1;
});
console.log("meetingTime 값 분포:");
for (const [k, n] of Object.entries(counts)) console.log(`  ${n}건: ${k}`);
process.exit(0);
