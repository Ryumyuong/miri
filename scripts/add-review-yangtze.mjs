// 장강 후기 1건 추가. 실행: node scripts/add-review-yangtze.mjs
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

const r = {
  author: "강**",
  title: "장강의 절경을 만끽한 여행",
  region: "장강삼협",
  ship: "빅토리아 셀레네",
  category: "장강크루즈",
  content: "삼협댐과 장강의 웅장한 경치가 압도적이었습니다. 리버 크루즈 특유의 여유로움이 좋았어요.",
  date: "2026-03-15",
  rating: 5,
  views: 198,
  imageUrl: "/reviews/yangtze.png",
  createdAt: "2026-03-15T09:00:00",
};

const snap = await getDocs(collection(db, "reviews"));
const existing = new Set(snap.docs.map((d) => d.data().title));
if (existing.has(r.title)) {
  console.log("건너뜀(이미 있음):", r.title);
} else {
  await addDoc(collection(db, "reviews"), r);
  console.log("추가:", r.title);
}
process.exit(0);
