// 미리크루즈 도메인 타입 — 추후 Prisma 모델/DB 스키마와 1:1로 매핑됩니다.

export type VoyageStatus = "예약 가능" | "예약 중" | "출발 확정" | "마감";

/** 일자별 상세 여행일정 (여행일정 탭에 그대로 노출) */
export interface DayPlan {
  day: number; // 1, 2, ...
  date: string; // YYYY-MM-DD
  weekday?: string; // 금요일 / 토요일 ...
  title?: string; // 일자 요약(기항지 등) — 선택
  body: string[]; // 일정 본문 (줄 단위)
  hotel?: string; // 숙박
  meals?: { breakfast?: string; lunch?: string; dinner?: string }; // 조식 / 중식 / 석식
}

/** ── 노션형 일정 에디터: 일자별 블록 모델 ─────────────────
 *  관리자 "여행 일정 작성"에서 일차별로 블록을 쌓아 구성하고,
 *  상세 페이지 "주요 여행일정"에 그대로 렌더링한다. */
export type ItineraryBlockType =
  | "air" // 항공 (구버전: 출발+도착 한 블록)
  | "airDepart" // 출발 항공
  | "airArrive" // 도착 항공
  | "flight" // 항공 (경유 포함 단일 카드)
  | "text" // 제목 텍스트
  | "content" // 내용 텍스트 (본문만)
  | "meal" // 식사
  | "image" // 이미지
  | "ship" // 선박
  | "lodging" // 숙소
  | "tour"; // 관광정보 (관광정보 카드)

export interface ItineraryBlock {
  id: string;
  type: ItineraryBlockType;
  // air
  airline?: string; // 항공사 / 편명
  dateDepart?: string; // 출발일 (ISO)
  time?: string; // 출발시간
  dateArrive?: string; // 도착일 (ISO)
  timeArrive?: string; // 도착시간
  from?: string; // 출발지
  to?: string; // 도착지
  // text
  title?: string; // 제목
  text?: string; // 본문 설명
  // meal — 통합 식사 블록(하루 1개): 조식/중식/석식 내용. 비어있으면 '미포함'.
  breakfast?: string; // 조식 내용 (예: 선상식/현지식/기내식)
  lunch?: string; // 중식 내용
  dinner?: string; // 석식 내용
  meal?: string; // (구버전) 식사 구분 (조식/중식/석식) — 하위호환 렌더용
  place?: string; // (구버전) 장소
  desc?: string; // 설명
  // image
  url?: string; // 이미지 URL (레거시 단일)
  urls?: string[]; // 이미지 여러 장
  caption?: string; // 캡션
  // ship
  shipName?: string; // 선박명
  boarding?: string; // 승선 정보
  departure?: string; // 출항 정보
  route?: string; // 항로
  // lodging
  lodgeName?: string; // 숙소명
  checkin?: string; // 체크인
  location?: string; // 위치 / 객실
  note?: string; // 비고
  // tour (관광정보 카드)
  tourCardId?: string; // 선택한 관광정보 카드 id
  tourKind?: PortKind; // 카드 구분(기항지/관광지) 스냅샷 — 카드 삭제 시에도 렌더 유지
  tourName?: string; // 관광지명
  tourCountry?: string; // 국가
  tourDesc?: string; // 설명
  tourImage?: string; // 이미지 URL
  // 공통 — 모든 블록의 카드 아래 설명
  blockDesc?: string;
  // 텍스트 블록(제목/내용) 스타일
  fontSize?: string; // 글자 크기 (작게/보통/크게/아주 크게)
  color?: string; // 강조 색상 (hex)
  // flight 블록 — 경유 포함 항공편(구간 목록)
  segments?: FlightSegment[];
}

/** 항공 구간 (인천→두바이, 두바이→코펜하겐 …) — 한 flight 블록에 여러 구간 */
export interface FlightSegment {
  airline?: string; // 항공사 / 편명 (예: 에미레이트 EK323)
  from?: string; // 출발지 (예: ICN 인천)
  to?: string; // 도착지 (예: DXB 두바이)
  dateDepart?: string; // 출발일 (ISO)
  timeDepart?: string; // 출발시간 (HH:MM)
  dateArrive?: string; // 도착일 (ISO)
  timeArrive?: string; // 도착시간 (HH:MM)
  durationMin?: number; // 실제 소요시간(분). 입력 시 자동계산 대신 이 값 사용 (시차 반영용)
}

export interface ItineraryDay {
  id: string;
  dayNo: number; // 0일차, 1일차 ...
  label?: string; // 일차 제목(선택)
  blocks: ItineraryBlock[];
}

/** 임시저장 스냅샷 — 저장 시점별 초안 버전(되돌리기용) */
export interface ItineraryDraft {
  id: string;
  savedAt: string; // 저장 시각 (표시용, 예: "2026-07-31 15:56")
  days: ItineraryDay[];
}

/** 운항 일정 (상품) */
export interface Voyage {
  id: string;
  code?: string; // 상품 코드 (예: MC-00001) — 계약서 문자·관리용
  title: string; // 예: "2026년 05월 14일 [로얄캐리비안 보이저호] 알래스카 크루즈 8박 10일"
  region: string; // 권역: 알래스카 / 유럽 지중해 / 중동 / 동남아 ...
  shipName: string; // 선박명
  line: string; // 선사: MSC Cruises / Royal Caribbean ...
  departDate: string; // 출항일 (YYYY-MM-DD)
  arriveDate: string; // 귀항일 (YYYY-MM-DD)
  nights: number; // 박
  days: number; // 일
  priceFrom: number; // 최저가 (원)
  roomPrices?: Record<string, number>; // 객실별 요금(내측/오션뷰/발코니/스위트) 직접 지정. 비우면 priceFrom×배수 자동계산.
  status: VoyageStatus; // 표시용 상태 (statusManual 있으면 그 값, 없으면 자동 계산)
  statusManual?: VoyageStatus; // 관리자가 직접 지정한 상태 (없으면 자동 계산)
  countries?: string[]; // 방문 국가 태그
  itinerary?: string[]; // 기항지 순서
  schedule?: { date: string; place: string; arrive: string; depart: string }[]; // 일자별 상세 일정(있으면 표로 표시)
  dayPlans?: DayPlan[]; // 일자별 상세 여행일정(있으면 schedule·자동생성보다 우선 표시)
  itineraryDays?: ItineraryDay[]; // 노션형 블록 에디터로 작성한 일정(있으면 최우선 표시)
  itineraryStatus?: "draft" | "published"; // 여행일정 발행 상태 (draft=초안, 상세페이지 미노출)
  itineraryDaysDraft?: ItineraryDay[] | null; // 미발행 초안(관리자 편집용, 공개 안 함). 발행 시 itineraryDays로 반영하고 비움.
  itineraryDrafts?: ItineraryDraft[] | null; // 임시저장 스냅샷 목록(저장 시점별 버전, 되돌리기용)
  published?: boolean; // 운항 일정(상품) 공개 여부. false=임시저장(고객 미노출), 미설정/true=공개
  dDay?: number; // 출발까지 D-day (departDate 기준 자동 계산)
  // 운영 지표
  reservedCount: number; // 예약 인원
  passportDone: number; // 여권 완료
  passportPending: number; // 미제출
  contractCount: number; // 계약금
  thumbnail?: string;

  // ── 상세(예약) 페이지 콘텐츠 — 비어 있으면 기본값으로 표시 ──
  flight?: string; // 항공편 (예: 아시아나 OZ202)
  description?: string; // 상품정보 설명문
  features?: string[]; // 상품 특징 칩
  included?: string[]; // 포함 사항
  excluded?: string[]; // 불포함 사항
  meetingPlace?: string; // 미팅 장소
  meetingTime?: string; // 미팅 시간
  meetingInfo?: string; // 미팅 안내문
  meetingMapImage?: string; // 미팅장소 지도 이미지 (관리자 업로드)
  meetingMapUrl?: string; // 미팅장소 지도 링크 (지도보기 → 새 탭)
  routeMapImage?: string; // 지도정보/항로 이미지 (관리자 업로드)
  videos?: { label: string; url: string }[]; // 영상으로 만나는 크루즈 (제목 + URL)
  guide?: string; // 인솔자 안내 (요약정보)
  insurance?: string; // 여행자보험 안내 (요약정보)
  isPrime?: boolean; // 프라임 상품 지정 (프라임 페이지 + 일정 목록 함께 노출)
  primeOrder?: number; // 프라임 노출 순서 (작을수록 앞)
  terms?: string[]; // 약관 / 환불 규정
  safety?: { title: string; body: string }[]; // 안전 / 유의사항
  productImages?: string[]; // 상품정보 갤러리 이미지
}

/** 가예약 신청 (승객 1명 = 1건). 여권 등록 정보 포함 */
/** 승객(일행) 1인 — CSV 내보내기 컬럼과 1:1 대응.
 *  주민번호 뒷자리(rrnBack)는 화면 표기는 안 해도 저장은 한다.
 *  만나이는 birth(생년월일)로 계산하므로 저장하지 않음. */
export interface Passenger {
  id: string;
  nameKo?: string; // 한글이름
  lastNameEn?: string; // 영문 성
  firstNameEn?: string; // 영문 이름
  rrnFront?: string; // 주민번호 앞 6자리
  rrnBack?: string; // 주민번호 뒷 7자리 (표기 X, 저장 O)
  gender?: "남" | "여" | "";
  roomType?: string; // 객실타입 (내측/오션뷰/발코니/스위트)
  rooming?: string; // 루밍(객실 배정 그룹/호수 — 예: A, B, 1201호)
  birth?: string; // 생년월일 YYYY-MM-DD (만나이 계산용)
  passportNumber?: string; // 여권번호
  passportIssue?: string; // 여권 발급일
  passportExpiry?: string; // 여권 만료일
  phone?: string; // 고객연락처
  productPrice?: number; // 상품가
  adjustAmount?: number; // 변동금액
  note1?: string; // 비고1
  note2?: string; // 비고2
}

export interface Reservation {
  id: string;
  code?: string; // 예약코드 (일행 단위, 예: MC25-0001)
  passengers?: Passenger[]; // 일행 승객 목록 (신규 구조)
  contractSentAt?: string; // 여행자계약서 문자 발송 시각 (있으면 '발송됨')
  voyageId: string;
  voyageTitle: string;
  departDate: string; // 신청 시점 스냅샷
  arriveDate: string; // 여권 만료 알림 계산 기준
  name: string; // 신청자(승객) 이름
  phone: string;
  email?: string; // 신청 폼에서는 필수 입력. 이전 예약 데이터에는 없어 옵셔널
  room: string; // 객실 타입
  roomNo?: string; // 객실 호수 (관리자 배정)
  headcount: number; // 동반 포함 인원
  // ── 여권 등록("스캔") ──
  passportNumber?: string;
  passportExpiry?: string; // YYYY-MM-DD (있으면 여권 완료)
  passportImage?: string; // 스캔 이미지 URL
  // ── 결제 ──
  contractPaid: boolean; // 계약금 납부 여부
  createdAt: string; // YYYY-MM-DD
}

/** 관광정보 카드 구분 — 기항지(항구) / 관광지 */
export type PortKind = "기항지" | "관광지";

/** 관광정보 카드(기항지·관광지) — 여러 상품에서 재사용 */
export interface PortCard {
  id: string;
  name: string; // 바르셀로나
  kind?: PortKind; // 기항지 / 관광지 — 없으면 '기항지'로 간주(기존 카드 호환)
  region: string; // 유럽
  country: string; // 스페인
  description: string;
  imageUrl?: string;
  usedByCount: number; // N개 상품에 사용 중 (= voyageIds 길이와 동기화)
  voyageIds?: string[]; // 이 카드를 관광정보에 노출할 운항 일정 id 목록 (명시적 지정)
  order?: number; // 지역 내 정렬 순서 (작을수록 앞)
}

/** 선박 정보 카드 */
export interface ShipCard {
  id: string;
  name: string; // MSC Seaview
  line: string; // 선사
  roomType?: string; // 룸타입 (인사이드/오션뷰/발코니/스위트 등)
  capacity?: number;
  description: string; // 상품 설명(상세 '상품정보' 탭 노출)
  imageUrl?: string;
  productImages?: string[]; // 상품 이미지(여러 장) — 상세 '상품정보' 탭 갤러리
  features?: string[]; // 상품 특징 — 상세 '상품정보' 탭
  usedByCount: number;
}

export type PaymentStatus = "결제완료" | "부분결제" | "미결제" | "환불";

/** 결제 내역 */
export interface Payment {
  id: string;
  customerName: string;
  voyageTitle: string;
  amount: number;
  paid: number;
  status: PaymentStatus;
  date: string;
}

export type ConsultStatus = "신규" | "진행 중" | "완료" | "보류";

/** 상담 내역 */
export interface Consult {
  id: string;
  customerName: string;
  phone: string;
  topic: string;
  status: ConsultStatus;
  createdAt: string;
  reply?: string; // 관리자 답변
  repliedAt?: string; // 답변 일자
}

export type AlertLevel = "danger" | "warning" | "info";

/** 운영 알림 */
export interface AlertItem {
  id: string;
  level: AlertLevel;
  tag: string; // D-150 / 여권 만료 / 미제출 ...
  message: string;
  href?: string; // 클릭 시 이동할 관리자 페이지 (자동 알림에서 사용)
}

/** 고객 후기 */
export interface Review {
  id: string;
  author: string; // 김**
  title: string; // 후기 제목
  region: string; // 표시용 세부 권역: 서부지중해
  ship: string; // 선박명
  category: string; // 필터용 대권역: 유럽 / 미주·알래스카 / 중동 / 동북아 / 동남아 / 장강크루즈
  content: string;
  date: string;
  rating: number; // 1~5
  views: number;
  imageUrl?: string;
  // ── 작성 폼 추가 정보 ──
  phone?: string; // 연락처
  travelDate?: string; // 여행일자
  travelDest?: string; // 여행지
  images?: string[]; // 첨부 사진(여러 장)
  voyageId?: string; // 연결된 운항 일정
  userId?: string; // 작성 회원 계정 id (본인 수정/삭제 판정용)
  consentPrivacy?: boolean; // 개인정보 수집·이용 동의
  consentPromo?: boolean; // 후기 홍보 활용 동의
  consentPolicy?: boolean; // 후기 게시 및 운영정책 동의
  createdAt?: string;
  order?: number; // 노출 순서 (관리자 수동 정렬, 작을수록 먼저)
}

/** 지역 스토리 (메인 3번째 섹션 커버플로우 카드) */
export interface RegionStory {
  id: string;
  region: string; // 유럽 / 미주·알래스카 ...
  watermark: string; // 뒤 배경 큰 영문 (EUROPE, ALASKA ...)
  titleLines: [string, string]; // 카드 하단 2줄 타이틀
  tags: string[]; // 하단 칩
  href: string;
  imageUrl?: string; // 카드 배경 사진 (없으면 그라데이션)
}

/** 사이트 전역 설정 (관리자 시스템 설정) */
export interface SiteSettings {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  businessHours: string;
}

/** 대시보드 상단 요약 지표 */
export interface DashboardStat {
  label: string;
  value: string;
  delta?: string;
}
