import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const vs = await getDocs(collection(db, "voyages"));
const byRegion = {};
vs.docs.forEach((d) => {
  const v = d.data();
  (byRegion[v.region] ??= []).push(v.title);
});
for (const [r, titles] of Object.entries(byRegion)) {
  console.log(`\n[${r}] (${titles.length})`);
  titles.forEach((t) => console.log("  - " + t));
}
process.exit(0);
