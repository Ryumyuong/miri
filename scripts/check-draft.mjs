import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const vs = await getDocs(collection(db, "voyages"));
vs.docs.forEach((d) => {
  const v = d.data();
  if (Array.isArray(v.itineraryDaysDraft)) {
    console.log(d.id, "| draft일수:", v.itineraryDaysDraft.length, "| 발행일수:", (v.itineraryDays?.length ?? 0), "| status:", v.itineraryStatus);
  }
});
console.log("(위에 나온 상품들은 초안이 Firestore에 저장돼 있음)");
process.exit(0);
