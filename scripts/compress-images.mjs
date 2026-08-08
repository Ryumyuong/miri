// 폴더 내 이미지를 화질 저하 최소화하며 압축. 사용: node scripts/compress-images.mjs <폴더>
//  - EXIF 방향 자동 보정(.rotate) → 세로 사진 눕는 문제 방지
//  - 긴 변 최대 2200px, JPEG 화질 82(mozjpeg)
import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) { console.error("폴더 경로를 지정하세요."); process.exit(1); }
const MAX = 2200;
const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();

let before = 0, after = 0;
for (const f of files) {
  const p = path.join(dir, f);
  const tmp = p + ".tmp.jpg";
  const b = fs.statSync(p).size;
  await sharp(p)
    .rotate()
    .resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(tmp);
  fs.renameSync(tmp, p);
  const a = fs.statSync(p).size;
  before += b; after += a;
  console.log(`${f}: ${(b / 1048576).toFixed(2)}MB → ${(a / 1048576).toFixed(2)}MB`);
}
console.log(`\n✅ ${files.length}장 · 합계 ${(before / 1048576).toFixed(1)}MB → ${(after / 1048576).toFixed(1)}MB`);
process.exit(0);
