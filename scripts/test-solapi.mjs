// Solapi 키/발신번호 검증 (문자 발송 안 함). 실행: node scripts/test-solapi.mjs
import crypto from "crypto";
import fs from "fs";

const env = {};
for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const { SOLAPI_API_KEY: apiKey, SOLAPI_API_SECRET: apiSecret, SOLAPI_SENDER: sender } = env;

// 요청마다 새 서명 생성 (재사용 금지)
function auth() {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}
const get = async (url) => {
  const r = await fetch(url, { headers: { Authorization: auth() } });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};

const bal = await get("https://api.solapi.com/cash/v1/balance");
console.log("[잔액]", bal.status, "point:", bal.data.point, "balance:", bal.data.balance);

const sp = await get("https://api.solapi.com/senderid/v1/numbers");
const list = Array.isArray(sp.data) ? sp.data : sp.data.senderIds || sp.data.numbers || [];
const nums = list.map((n) => n.phoneNumber || n.number || n);
console.log("[발신번호]", sp.status, nums.length ? nums : JSON.stringify(sp.data).slice(0, 160));
const ok = nums.some((n) => String(n).replace(/\D/g, "") === sender);
console.log(`\n발신번호 ${sender} 등록됨? ${ok ? "✅ 예 — 발송 가능" : "❌ 아니오 — Solapi 콘솔에서 발신번호 등록/인증 필요"}`);
process.exit(0);
