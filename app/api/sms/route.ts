import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 문자 발송 서버 라우트 — Solapi(CoolSMS) 연동.
 *
 * 연동 방법:
 *   1) Solapi 콘솔에서 API Key / API Secret 발급, 발신번호 등록(사전 인증)
 *   2) .env.local 에 아래 3개 설정:
 *        SOLAPI_API_KEY=발급받은키
 *        SOLAPI_API_SECRET=발급받은시크릿
 *        SOLAPI_SENDER=01000000000   (등록 완료된 발신번호, 하이픈 없이)
 *   3) 서버 재시작 → 이 라우트가 실제 Solapi API로 발송
 *
 * 키가 하나라도 없으면 stub(로그만, ok 반환)으로 동작 → 예약/상담 흐름은 그대로 진행.
 * 인증: HMAC-SHA256 (apiSecret 으로 date+salt 서명). SDK 불필요.
 */
export async function POST(req: Request) {
  const { to, text } = await req
    .json()
    .catch(() => ({}) as { to?: string; text?: string });

  if (!to || !text) {
    return NextResponse.json({ ok: false, error: "to/text 가 필요합니다." }, { status: 400 });
  }

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const sender = process.env.SOLAPI_SENDER;

  // 키 미설정: stub (로그만)
  if (!apiKey || !apiSecret || !sender) {
    console.log("[SMS:stub] to=%s text=%s", to, String(text).slice(0, 60));
    return NextResponse.json({ ok: true, stub: true });
  }

  // Solapi HMAC-SHA256 인증 헤더
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  const authorization = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

  const toNum = String(to).replace(/\D/g, "");
  const fromNum = String(sender).replace(/\D/g, "");

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authorization },
      // type 미지정 시 Solapi가 길이에 따라 SMS/LMS 자동 선택
      body: JSON.stringify({ message: { to: toNum, from: fromNum, text } }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("[SMS:solapi] 발송 실패", data);
      return NextResponse.json(
        { ok: false, error: (data as { errorMessage?: string })?.errorMessage ?? "발송 실패" },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true, id: (data as { messageId?: string })?.messageId });
  } catch (e) {
    console.error("[SMS:solapi] 예외", e);
    return NextResponse.json({ ok: false, error: "발송 중 오류" }, { status: 500 });
  }
}
