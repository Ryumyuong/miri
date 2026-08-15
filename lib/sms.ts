// 문자 알림 발송 추상화.
// ⚠️ 실제 자동 발송은 SMS 게이트웨이(알리고 / Solapi(CoolSMS) / NHN Cloud 등)의
//    서버 API 연동이 필요합니다(키 노출 방지를 위해 서버 라우트에서 호출).
//    아래 sendSms 내부의 TODO 위치에 실제 API 호출을 넣으면 됩니다.
//    현재(키 미설정)는 발송 기기의 기본 문자앱을 여는 방식으로 대체합니다.

export function buildReplyMessage(name: string, reply: string): string {
  return [
    `[미리크루즈] ${name}님, 문의하신 내용에 답변이 등록되었습니다.`,
    "",
    "▶ 답변 내용",
    reply,
    "",
    "홈페이지 > 예약조회에서 이름·연락처를 입력하시면 문의 내역과 답변을 다시 확인하실 수 있습니다.",
    "문의: 1644-8868 (평일 09:00~18:00)",
  ].join("\n");
}

/** 여행자 계약서 안내 문자 템플릿 */
export function buildContractMessage(opts: {
  name?: string;
  voyageTitle: string;
  code?: string;
  url?: string;
}): string {
  const { name, voyageTitle, code, url } = opts;
  return [
    `[미리크루즈] ${name ? name + "님 " : ""}여행자 계약서 안내`,
    `상품: ${voyageTitle}`,
    code ? `예약코드: ${code}` : "",
    "아래 링크에서 계약 내용을 확인·동의해 주세요.",
    url ?? "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** 계약서 등 '자동 발송' 문자 — 서버 라우트(/api/sms) 경유.
 *  게이트웨이 키 미설정 상태에선 라우트가 no-op(stub) 으로 ok 만 반환한다. */
export async function sendContractSms(
  phone: string,
  message: string,
): Promise<{ ok: boolean }> {
  const to = (phone ?? "").replace(/[^0-9]/g, "");
  if (!to) return { ok: false };
  try {
    const res = await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text: message }),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

/** 문자 발송 — 서버 라우트(/api/sms) 경유(Solapi). 키 미설정 시 stub(ok). */
export async function sendSms(phone: string, message: string): Promise<void> {
  const num = (phone ?? "").replace(/[^0-9]/g, "");
  if (!num) return;
  try {
    await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: num, text: message }),
    });
  } catch {
    /* 발송 실패는 호출부 흐름을 막지 않음 */
  }
}
