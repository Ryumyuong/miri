// 2027-05-09 퀀텀 알래스카 추가. 실행: node scripts/add-alaska3.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI",
  authDomain: "miri-6246c.firebaseapp.com",
  projectId: "miri-6246c",
  storageBucket: "miri-6246c.firebasestorage.app",
  messagingSenderId: "143650281515",
  appId: "1:143650281515:web:b459ea9481f2baeea7b26e",
});
const db = getFirestore(app);

function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const v = {
  title: "2027년 05월 09일 [로얄캐리비안 퀀텀호] 알래스카 크루즈 8박 10일",
  region: "미주·알래스카",
  shipName: "퀀텀 오브 더 시즈",
  line: "Royal Caribbean",
  departDate: "2027-05-09",
  arriveDate: addDays("2027-05-09", 9),
  nights: 8,
  days: 10,
  priceFrom: 5940000,
  countries: ["미국", "캐나다"],
  itinerary: ["시애틀", "싯카", "스캐그웨이", "주노", "빅토리아", "시애틀"],
  flight: "대한항공 (KE041)",
  code: "CA11627526051576079",
  description: "Royal Caribbean Quantum of the Seas호 알래스카크루즈 (시애틀/싯카/스캐그웨이/주노/빅토리아/시애틀)",
  thumbnail: "/ships/quantum-of-the-seas.jpg",
};

const snap = await getDocs(collection(db, "voyages"));
const existing = new Set(snap.docs.map((d) => d.data().title));
if (existing.has(v.title)) {
  console.log("건너뜀(이미 있음):", v.title);
} else {
  await addDoc(collection(db, "voyages"), v);
  console.log("추가:", v.title);
}
process.exit(0);
