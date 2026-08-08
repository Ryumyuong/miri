import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const snap = await getDoc(doc(db, "voyages", "8srXFNFNxecVMuvBL9GW"));
const v = snap.data();
console.log("itineraryStatus:", v.itineraryStatus);
const days = v.itineraryDays ?? [];
days.forEach((d) => {
  console.log(`\n--- dayNo ${d.dayNo} | label: ${JSON.stringify(d.label)} | blocks: ${d.blocks?.length ?? 0} ---`);
  (d.blocks ?? []).forEach((b) => {
    const preview = JSON.stringify({ ...b, blockDesc: undefined }).slice(0, 160);
    console.log(`  [${b.type}] ${preview}`);
  });
});
process.exit(0);
