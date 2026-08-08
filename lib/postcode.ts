// 다음(카카오) 우편번호 서비스 — 스크립트를 동적 로드 후 팝업을 띄웁니다.

type DaumPostcode = new (opts: {
  oncomplete: (data: { zonecode: string; roadAddress: string; jibunAddress: string }) => void;
}) => { open: () => void };

declare global {
  interface Window {
    daum?: { Postcode: DaumPostcode };
  }
}

const SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.daum?.Postcode) return resolve();
    const s = document.createElement("script");
    s.src = SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("우편번호 서비스 로드 실패"));
    document.head.appendChild(s);
  });
}

/** 우편번호 검색 팝업을 열고 결과(우편번호·주소)를 콜백으로 전달. */
export async function openPostcode(
  onComplete: (zip: string, address: string) => void,
): Promise<void> {
  try {
    await loadScript();
    new window.daum!.Postcode({
      oncomplete: (data) => onComplete(data.zonecode, data.roadAddress || data.jibunAddress),
    }).open();
  } catch {
    alert("우편번호 검색을 불러오지 못했습니다. 주소를 직접 입력해 주세요.");
  }
}
