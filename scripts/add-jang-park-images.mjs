// 장**(서부지중해)·박**(아라비아해) 후기에 이미지 연결. 실행: node scripts/add-jang-park-images.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const jobs = [
  { title: "서부지중해 크루즈 여행 기대에 부풀어서 오게 되었는데...", dir: "/reviews/jang-seobu", n: 13, thumb: 1 },
  { title: "크루즈여행을 떠난다는 것은 그 자체로 큰 선물이었습니다.", dir: "/reviews/park", n: 7, thumb: 1 },
];

const snap = await getDocs(collection(db, "reviews"));
for (const j of jobs) {
  const t = snap.docs.find((d) => d.data().title === j.title);
  if (!t) { console.error("후기 못 찾음:", j.title.slice(0, 20)); continue; }
  const images = Array.from({ length: j.n }, (_, i) => `${j.dir}/img-${String(i + 1).padStart(2, "0")}.jpg`);
  const imageUrl = `${j.dir}/img-${String(j.thumb).padStart(2, "0")}.jpg`;
  await updateDoc(doc(db, "reviews", t.id), { images, imageUrl });
  console.log(`✅ ${j.title.slice(0, 18)} → ${j.n}장 (id: ${t.id})`);
}
process.exit(0);
