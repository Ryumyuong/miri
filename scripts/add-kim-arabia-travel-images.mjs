// 김** "미리크루즈로 아라비아여행" 후기: 사진 1장 압축+연결
// 실행: node scripts/add-kim-arabia-travel-images.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const SRC = "C:/Users/PC_1M/Downloads";
const SLUG = "kim-arabia-travel";
const OUT = path.join("public", "reviews", SLUG);
const MAX = 2200;

const sources = [
  "0daa48d6-3d13-4a73-a107-8c6566516e99", // 01 마디낫 주메이라 + 부르즈 알 아랍
];

fs.mkdirSync(OUT, { recursive: true });
let before = 0, after = 0;
for (let i = 0; i < sources.length; i++) {
  const src = path.join(SRC, sources[i] + ".jpg");
  const out = path.join(OUT, `img-${String(i + 1).padStart(2, "0")}.jpg`);
  const b = fs.statSync(src).size;
  const buf = await sharp(src)
    .rotate()
    .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(out, buf);
  before += b; after += buf.length;
  console.log(`img-${String(i + 1).padStart(2, "0")}: ${(b / 1048576).toFixed(2)}MB → ${(buf.length / 1048576).toFixed(2)}MB`);
}
console.log(`\n압축 ${sources.length}장 · ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`);

const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const TITLE = "미리크루즈로 아라비아여행";
const images = sources.map((_, i) => `/reviews/${SLUG}/img-${String(i + 1).padStart(2, "0")}.jpg`);
const thumb = `/reviews/${SLUG}/img-01.jpg`;

const snap = await getDocs(collection(db, "reviews"));
const target = snap.docs.find((d) => d.data().title === TITLE);
if (!target) { console.error("후기를 찾지 못함"); process.exit(1); }
await updateDoc(doc(db, "reviews", target.id), { images, imageUrl: thumb });
console.log(`\n✅ ${TITLE} → ${images.length}장 (id: ${target.id})`);
process.exit(0);
