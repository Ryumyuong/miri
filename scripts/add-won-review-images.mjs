// 원** 후기에 이미지 27장 연결. 실행: node scripts/add-won-review-images.mjs
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);

const TITLE = "다음에 또 크루즈를 이용하게 된다면 미리크루즈 최성욱 인솔자님과 함께 여행 하기를 희망한다.";
const images = Array.from({ length: 27 }, (_, i) => `/reviews/won/img-${String(i + 1).padStart(2, "0")}.jpg`);
const thumb = "/reviews/won/img-16.jpg"; // 팔레르모 자전거(풍경) 썸네일

const snap = await getDocs(collection(db, "reviews"));
const target = snap.docs.find((d) => d.data().title === TITLE);
if (!target) { console.error("후기를 찾지 못함"); process.exit(1); }
await updateDoc(doc(db, "reviews", target.id), { images, imageUrl: thumb });
console.log(`✅ 이미지 ${images.length}장 연결 완료 (id: ${target.id})`);
process.exit(0);
