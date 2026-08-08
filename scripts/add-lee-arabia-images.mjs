// 이**(아라비아해) "홈쇼핑 여행상품을 보다 알게된..." 후기에 이미지 5장 연결
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const TITLE = "홈쇼핑 여행상품을 보다 알게된 늘곁애라이프온투어 미리크루즈 상품을 접하고";
const DIR = "/reviews/lee-arabia";
const images = Array.from({ length: 5 }, (_, i) => `${DIR}/img-${String(i + 1).padStart(2, "0")}.jpg`);
const imageUrl = `${DIR}/img-03.jpg`; // 셰이크 자예드 그랜드 모스크 썸네일

const snap = await getDocs(collection(db, "reviews"));
const t = snap.docs.find((d) => d.data().title === TITLE);
if (!t) { console.error("후기 못 찾음"); process.exit(1); }
await updateDoc(doc(db, "reviews", t.id), { images, imageUrl });
console.log(`✅ ${TITLE.slice(0,18)} → 5장 (id: ${t.id})`);
process.exit(0);
