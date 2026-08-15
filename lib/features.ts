/** 기능 플래그 — 아직 준비되지 않은 기능을 코드는 남겨둔 채 화면에서만 숨긴다. */

/**
 * "영상으로 만나는 크루즈" 기능 사용 여부 (전체 kill switch).
 *
 * 2026-08-14 켬. 실제 고객 노출은 상품별 영상 등록 여부로 자동 결정된다
 * (CruiseBooking 의 showVideo — URL이 들어간 영상이 1개 이상일 때만 탭·섹션 노출).
 * 즉 영상을 안 넣은 상품에는 아무것도 안 뜨므로, 평소엔 이 값을 건드릴 일이 없다.
 *
 * false로 내리면 아래 3곳이 영상 유무와 무관하게 한꺼번에 숨는다:
 *   - 관리자 · 운항 일정 수정 → ⑤ 영상으로 만나는 크루즈 입력칸 (VoyageManager)
 *   - 고객 상세페이지 → "영상정보" 탭 버튼 (CruiseBooking)
 *   - 고객 상세페이지 → 영상 섹션 sec-8 (CruiseBooking / VideoGallery)
 */
// 타입을 boolean으로 명시 — 리터럴 타입이면 TS가 분기를 "항상 참/거짓"으로 좁힌다
export const SHOW_VIDEO_SECTION: boolean = true;

/** 상세페이지 탭 이름 — 플래그로 숨길 때 식별용 */
export const VIDEO_TAB: string = "영상정보";
