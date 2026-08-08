// 김** 부부 아라비아 "안녕하세요~ 저희 부부는 2026년 1/16~1/25..." 후기: 사진 18장 압축+연결
// 편지지 스캔 2장(19c9e89e, 20ecb568 = A4 2480x3508)은 제외.
// 실행: node scripts/add-kim-couple-arabia-images.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const SRC = "C:/Users/PC_1M/Downloads";
const SLUG = "kim-couple-arabia";
const OUT = path.join("public", "reviews", SLUG);
const MAX = 2200;

// 순서대로 (편지지 제외한 18장)
const sources = [
  "4870e692-e7b4-440a-b937-c393a9b113de", // 01 스테인드글라스 천장 아트리움(부인)
  "af62898f-c445-4d37-8feb-fb9cf9d40950", // 02 두바이 운하 다리(부인)
  "3e830dc2-6e48-4ee8-83d1-0e154ff8537e", // 03 화이트파티 댄스
  "75273011-4635-4673-8582-b64e53545704", // 04 워터슬라이드 데크
  "21794e92-3467-4191-8815-e989c4459d68", // 05 로프코스
  "a3d2d99f-3f3a-416c-9450-b58075a63547", // 06 크루즈비치 주전자 조형물+선박
  "27a49266-e139-4c89-8114-3dcaa06e1ed0", // 07 미러 아트리움 에스컬레이터(남편)
  "491dbf5f-5271-4c07-8ddc-dc4c1d38a78c", // 08 워터파크 디테일
  "9a8bc53c-a005-4bbd-8e64-dd20dba7c676", // 09 골드수크(부인)
  "1c576a82-967a-4413-bb3a-8ead2d261cd7", // 10 부르즈 칼리파 주간
  "10d9eda4-b4bb-4fb2-809b-2fc7613bed03", // 11 두바이몰 루프탑 정찬(부부)
  "58ec7c68-39a4-4477-85ba-e482c8352b74", // 12 부르즈 칼리파 흐린날
  "8a5854c0-d6fd-4319-9ae0-cc688f616c95", // 13 두바이 분수쇼
  "b3f28833-09af-4476-844b-3df25a13672f", // 14 두바이 마리나(부부)
  "22fddffc-a4fe-4f10-bead-b2d764b7d99d", // 15 부르즈 칼리파 야경(블루)
  "7a213706-11e9-4c64-9901-090c207d5bbf", // 16 셰이크 자예드 그랜드 모스크
  "db1a4c16-f52b-4a1b-9b47-04777805b0f0", // 17 화이트파티 댄서
  "9fb9ef7e-4821-424a-a7c4-8fdd21d69f67", // 18 두바이몰 호수+스카이라인 노을
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

// Firestore 연결
const app = initializeApp({ apiKey: "AIzaSyCV3ld0N5CjK2KojF6dlnmmICljCjb9AgI", authDomain: "miri-6246c.firebaseapp.com", projectId: "miri-6246c", storageBucket: "miri-6246c.firebasestorage.app", messagingSenderId: "143650281515", appId: "1:143650281515:web:b459ea9481f2baeea7b26e" });
const db = getFirestore(app);
const TITLE = "안녕하세요~ 저희 부부는 2026년 1/16~1/25일까지 아라비아 크루즈를 다녀왔습니다.";
const images = sources.map((_, i) => `/reviews/${SLUG}/img-${String(i + 1).padStart(2, "0")}.jpg`);
const thumb = `/reviews/${SLUG}/img-15.jpg`; // 부르즈 칼리파 야경 썸네일(정찬+분수쇼 하이라이트)

const snap = await getDocs(collection(db, "reviews"));
const target = snap.docs.find((d) => d.data().title === TITLE);
if (!target) { console.error("후기를 찾지 못함"); process.exit(1); }
await updateDoc(doc(db, "reviews", target.id), { images, imageUrl: thumb });
console.log(`\n✅ ${TITLE.slice(0, 20)} → ${images.length}장 (id: ${target.id})`);
process.exit(0);
