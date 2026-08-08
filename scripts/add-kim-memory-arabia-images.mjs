// 김** "평생 기억에 남을 미리크루즈 중동 크루즈여행을 다녀왔어요~" 후기: 사진 24장 압축+연결
// 편지지 없음(전부 4000x1848 사진). 실행: node scripts/add-kim-memory-arabia-images.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const SRC = "C:/Users/PC_1M/Downloads";
const SLUG = "kim-memory-arabia";
const OUT = path.join("public", "reviews", SLUG);
const MAX = 2200;

const sources = [
  "929c3b49-87b0-47b7-98c0-0bf3ef23cd0c", // 01 부르즈 칼리파(안개)
  "abc9d4ef-850f-4653-b4ac-a2d2c491b287", // 02 두바이 마리나(부인)
  "45cf84d9-43e5-4f16-9893-bfaa20f9f588", // 03 마디낫 주메이라+부르즈 알 아랍
  "1de7aa9e-2cee-4d3e-af49-99e2d07dfa38", // 04 부르즈 알 아랍(주메이라 비치)
  "f8d4ebb1-10ef-49a2-a37e-5fa9660243c1", // 05 아부다비 야자수 대로(에미리츠 팰리스)
  "21b3d9f9-6a0e-435e-bc3c-1270f874762b", // 06 카스르 알 와탄 외부
  "07eca2df-914b-4ea5-b648-f0b307b81659", // 07 셰이크 자예드 모스크 내부 샹들리에
  "32421862-4c0b-4adc-bbb0-f9df073ad0cb", // 08 해변+MSC 유리비아(부인)
  "6d2bb703-bb1a-4291-80f0-6f5c7f1aff03", // 09 바레인 유적지 가이드 설명
  "1e96237f-9975-45b3-b293-cf64712bc1f7", // 10 시르 바니 야스 섬 해변
  "b4777460-5262-46e6-b58c-ea8d924e5690", // 11 바레인 알 파티흐 대모스크 내부
  "fb324d69-cce8-4421-af99-438921d39735", // 12 현지 가이드(버스)
  "9ec84d76-3640-4541-b88b-74b8536d3c88", // 13 카타르 더 펄/베네치아 운하(부인)
  "444440f6-59f5-4987-ba40-92b38033d164", // 14 MSC 유리비아 기항 터미널
  "2e05d5eb-ab32-4642-8bf9-773c47751035", // 15 선상 라운지(위에서)
  "7a83a4de-81bd-40a1-8f15-9c24459ffa1a", // 16 선상 미러 아트리움+피아노
  "2c7e47aa-96d4-4a78-a0fd-ffc0bdd4f259", // 17 선상 갤러리아 프롬나드
  "154c27fe-d9c2-4e04-85f8-4f8fa0027d9f", // 18 주메이라 모스크(I LOVE 사인, 부인)
  "4c8f7bc1-776e-4519-95b2-c873d4ddb6a4", // 19 이집트 테마 건축물
  "22853fc8-7cf8-4219-81b1-76fbca743175", // 20 모스크 스테인드글라스 회랑
  "4bf9c1d9-6d82-43cf-ac11-2bd82679fb15", // 21 사막 낙타+투어객
  "975f5399-10a3-4647-b161-e770045ab17b", // 22 낙타 클로즈업
  "a32feaf5-3b05-473b-80fe-f3f122f0dadc", // 23 사막 사구(두 여성)
  "92917554-aa1e-4d9a-beae-ba88aa1a5293", // 24 MSC 유리비아 전경(기항 터미널)
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
const TITLE = "평생 기억에 남을 미리크루즈 중동 크루즈여행을 다녀왔어요~";
const images = sources.map((_, i) => `/reviews/${SLUG}/img-${String(i + 1).padStart(2, "0")}.jpg`);
const thumb = `/reviews/${SLUG}/img-03.jpg`; // 부르즈 알 아랍(마디낫 주메이라) 썸네일

const snap = await getDocs(collection(db, "reviews"));
const target = snap.docs.find((d) => d.data().title === TITLE);
if (!target) { console.error("후기를 찾지 못함"); process.exit(1); }
await updateDoc(doc(db, "reviews", target.id), { images, imageUrl: thumb });
console.log(`\n✅ ${TITLE.slice(0, 20)} → ${images.length}장 (id: ${target.id})`);
process.exit(0);
