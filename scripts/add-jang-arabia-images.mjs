// 장**(아라비아해) "정말 즐거운 여행이었습니다." 후기에 이미지 6장 연결
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const TITLE = "정말 즐거운 여행이었습니다.";
const DIR = "/reviews/jang-arabia";
const images = Array.from({ length: 6 }, (_, i) => `${DIR}/img-${String(i + 1).padStart(2, "0")}.jpg`);
const imageUrl = `${DIR}/img-04.jpg`; // 미래박물관 썸네일

const snap = await getDocs(collection(db, "reviews"));
const t = snap.docs.find((d) => d.data().title === TITLE);
if (!t) { console.error("후기 못 찾음"); process.exit(1); }
await updateDoc(doc(db, "reviews", t.id), { images, imageUrl });
console.log(`✅ ${TITLE} → 6장 (id: ${t.id})`);
process.exit(0);
