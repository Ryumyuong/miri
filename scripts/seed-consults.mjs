import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";
const app = initializeApp({ apiKey:"AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain:"miri-6246c.firebaseapp.com", projectId:"miri-6246c", storageBucket:"miri-6246c.firebasestorage.app", messagingSenderId:"143650281515", appId:"1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const items = [
  { id:"c1", customerName:"이바다", phone:"010-1234-5678", topic:"알래스카 크루즈 객실 문의", status:"신규", createdAt:"2026-06-20" },
  { id:"c2", customerName:"박여행", phone:"010-2222-3333", topic:"동남아 크루즈 일정 변경", status:"진행 중", createdAt:"2026-06-19" },
];
const snap = await getDocs(collection(db,"consults"));
if(!snap.empty){ console.log("이미 있음, 건너뜀"); process.exit(0); }
for(const it of items){ const {id,...rest}=it; await setDoc(doc(db,"consults",id),rest); }
console.log("✅ consults 시드:", items.length, "건"); process.exit(0);
