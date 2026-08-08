// 김** "기대 이상의 매우 만족" 후기에 이미지 27장 연결. 실행: node scripts/add-kim-seobu-images.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const TITLE = "서부지중해 크루즈, 기대 이상의 매우 만족한 여행 이었습니다!";
const images = Array.from({ length: 27 }, (_, i) => `/reviews/kim-seobu/img-${String(i + 1).padStart(2, "0")}.jpg`);
const thumb = "/reviews/kim-seobu/img-10.jpg"; // 사그라다 파밀리아(풍경) 썸네일

const snap = await getDocs(collection(db, "reviews"));
const target = snap.docs.find((d) => d.data().title === TITLE);
if (!target) { console.error("후기를 찾지 못함"); process.exit(1); }
await updateDoc(doc(db, "reviews", target.id), { images, imageUrl: thumb });
console.log(`✅ 이미지 ${images.length}장 연결 완료 (id: ${target.id})`);
process.exit(0);
