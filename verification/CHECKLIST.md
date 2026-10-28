# 미리크루즈 수정·검수 (2026-10-16)

실제 고객 데이터/첨부 이미지는 테스트에 사용하지 않았다. 모든 검증 승객은 `합성 승객`이다. 운영 DB 읽기·쓰기, 메일/SMS, 배포는 실행하지 않았다.

| 요구 | 기대값 | 실제 증거 | 상태 |
|---|---|---|---|
| 일정 집계 | 7팀·18명, 정원30 잔여12 | 합성 회귀 테스트 및 실제 상세 컴포넌트 출력 | 통과 |
| 오프라인 합산 | 18+5=23명, 잔여7 | remainingSeats 테스트, 편집창은 pax와 팀 수 각각 전달 | 통과 |
| 자동 상태 | 사용자 지정 정원23에 18+5이면 마감 | liveStatus 회귀 테스트; 편집창도 동일 함수 | 통과 |
| 팀 전체 취소 | 3명 팀 취소 시 6팀15명 | 메모리 Firestore 트랜잭션 대체 테스트 | 통과 |
| 대표자 취소 | 일행 유지, 17명, 취소 대표 CSV 제외 | 집계·CSV 및 실제 편집창 이벤트 테스트 | 통과 |
| 동행자 취소 | 활성인원만 집계, 원본 승객 보존 | 개별 취소/인원수 축소 저장 테스트 | 통과 |
| 모두 취소 | 0명·0팀, 여권 알림 없음 | 회귀 테스트 | 통과 |
| 복구·이력 | 정보·취소일시 유지, cancel/restore 누적 | 팀/승객 복구 및 중복 취소 테스트 | 통과 |
| 동시 변경 | 오래된 편집창 저장 거절 | 저장 충돌 테스트 | 통과 |
| 레거시 | 배열 없음은 headcount, 빈 배열은0 | 4명/빈 배열/0명 테스트 | 통과 |
| 룸리스트 | 내측/발코니 유지, 팀 내 A→B→미지정 | 실제 화면 및 인쇄 핸들러 18행, 팀 ID tie-break 테스트 | 통과 |
| 화면/인쇄 일관성 | 같은 정렬, 팀 시작 구분선 | 실제 컴포넌트 및 인쇄 HTML | 통과 |
| PC 1440×900 | 기존 모달 디자인, 가독성 | Edge 로컬 합성 HTML 시각 확인 | 통과 |
| 모바일 390×844 | 모달·스크롤 유지, 객실 표 가로 스크롤 | Edge 로컬 합성 HTML 시각 확인 | 통과 |
| 인쇄 | 18명, 내측16/발코니2, 팀 구분선 | 실제 printRooming 결과 HTML을 Edge에서 확인 | A4 PDF 18명 1페이지 / 54명 2페이지 통과 |
| 코드 검사 | TypeScript 오류 없음 | tsc --noEmit --incremental false | 통과 |
| 운영 연결 | 실제 권한·저장·배포 결과 | 운영 접속/쓰기를 하지 않음 | 미확인 |

검증 실행: `node scripts/verify-reservations.cjs` (Firebase/SMS를 로드 전에 대체, 네트워크 호출 없음). 이 테스트는 실제 컴포넌트 이벤트와 HTML을 검사하지만 완전한 브라우저 hydration/E2E 또는 Firestore 에뮬레이터 테스트는 아니다. 시각 검증은 합성 데이터로 렌더링한 실제 컴포넌트와 Tailwind CSS를 사용한다. 최종 production build도 성공했다(정적 페이지 39/39). 추가 검증·운영 접속 결과는 FINAL-VALIDATION.md 참조.

변경 코드:
- `lib/reservation-state.ts`: 유효승객, 레거시 변환, 취소 이벤트, 팀 내부 객실 정렬
- `lib/types.ts`, `lib/reservations.ts`: 선택 취소 필드, 소프트 취소/복구 트랜잭션, 편집 충돌 방지, 집계/알림
- `lib/useReservations.ts`: 활성 목록과 전체 기록 분리
- `lib/csv.ts`: 취소 승객 제외
- `components/admin/VoyageManager.tsx`: 팀 수와 인원 분리, 정원 기반 상태
- `components/admin/PassengerEditor.tsx`: 개별 취소/복구, 축소 시 기록 보존, 이력
- `components/admin/DashboardCalendar.tsx`, `components/admin/DashboardStats.tsx`: 동일 유효승객 집계
- `app/admin/voyages/[id]/page.tsx`: 취소목록·복구·일시, 상세 정원, 팀별 룸리스트/인쇄
- `scripts/verify-reservations.cjs`, `migrations/*`, `verification/*`: 합성 검증과 적용 안내

기존 미커밋 변경은 되돌리지 않았으며 원본의 관련 파일만 갱신한다. 원본 반영 전 파일은 작업공간 `original-backup`에 보존한다. DB 필수 작업 없음; 승인 후 적용 절차와 기존 공개 규칙 관련 확인 사항은 `migrations/README.md` 참조.
