import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const vs = await getDocs(collection(db, "voyages"));

// 블록 내용이 실제로 있는지(비어있지 않은지) 대략 판단
const contentCount = (days) => {
  if (!Array.isArray(days)) return 0;
  let n = 0;
  for (const d of days) for (const b of (d.blocks ?? [])) {
    const { id, type, ...rest } = b;
    if (type !== "meal" && Object.values(rest).some((x) => x && (typeof x !== "string" || x.trim()))) n++;
  }
  return n;
};

vs.docs.forEach((d) => {
  const v = d.data();
  const hasDraft = Array.isArray(v.itineraryDaysDraft);
  const pubDays = Array.isArray(v.itineraryDays) ? v.itineraryDays.length : 0;
  const pubContent = contentCount(v.itineraryDays);
  if (hasDraft) {
    const drDays = v.itineraryDaysDraft.length;
    const drContent = contentCount(v.itineraryDaysDraft);
    console.log(`${d.id} | 초안 ${drDays}일(내용블록 ${drContent}) | 발행 ${pubDays}일(내용블록 ${pubContent}) | title: ${String(v.title).replace(/\n/g," ").slice(0,30)}`);
  }
});
process.exit(0);
