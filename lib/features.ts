/** 기능 플래그 — 아직 준비되지 않은 기능을 코드는 남겨둔 채 화면에서만 숨긴다. */

/**
 * "영상으로 만나는 크루즈" 기능 사용 여부 (전체 kill switch).
 *
 * 2026-08-18 다시 끔 (false). 영상이 등록돼 있어도 아래 3곳이 전부 숨는다:
 *   - 관리자 · 운항 일정 수정 → ⑤ 영상으로 만나는 크루즈 입력칸 (VoyageManager)
 *   - 고객 상세페이지 → "영상정보" 탭 버튼 (CruiseBooking)
 *   - 고객 상세페이지 → 영상 섹션 sec-8 (CruiseBooking / VideoGallery)
 * 이미 저장된 영상 데이터는 지워지지 않는다. 화면에서만 감춘다.
 *
 * 영상이 확보되면 true 한 줄만 되돌리면 된다. 켠 뒤에는 상품별로 영상이
 * 등록된 상품에만 탭·섹션이 뜬다 (CruiseBooking 의 showVideo).
 */
// 타입을 boolean으로 명시 — 리터럴 타입이면 TS가 분기를 "항상 참/거짓"으로 좁힌다
export const SHOW_VIDEO_SECTION: boolean = false;

/** 상세페이지 탭 이름 — 플래그로 숨길 때 식별용 */
export const VIDEO_TAB: string = "영상정보";
