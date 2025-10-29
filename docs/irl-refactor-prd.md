# IRL 메타데이터/피드백 신뢰성 개선 리팩토링 PRD

## 1. 배경 & 문제 인식

최근 IRL 메타데이터 배포 이후 클라이언트는 다음 기능을 제공한다.

- 요청 시 `historyHash`, `policyVersion`, `candidates` 메타데이터 전송
- 게이트웨이 응답의 정책/점수/Trace 정보를 메시지에 태깅 후 배지 UI 표시
- 좋아요 토글 시 `/feedback` 엔드포인트로 사용자 피드백 전달

그러나 코드 리뷰 결과 아래 리스크가 확인되었다.

1. **엔드포인트 불일치**: 사양은 `/v1/irl/feedback`을 가정하지만 구현은 `/feedback` 사용 → 환경별 API와 어긋날 경우 즉시 실패.
2. **응답 메타데이터 파싱 취약**: 응답 구조가 `raw.message.metadata` 외 위치로 바뀌면 메타데이터가 누락되어 UI/텔레메트리 품질 저하.
3. **피드백 실패 미관측**: 피드백 전송 실패를 무조건 무시하여 실사용 통계에 왜곡 가능성.
4. (선택 리스크) **동적 import 남용 & 추적성 부족**: `sendFeedback` 모듈을 매번 동적 로딩, Trace ID 노출이 제한되어 디버깅이 어려움.

## 2. 목표

- IRL 메타데이터 파이프라인을 **버전 안전성**과 **관측성**을 갖춘 구조로 강화한다.
- 사용자 피드백 데이터가 신뢰도 높게 수집되도록 **성공/실패 감지 및 재시도 전략**을 제공한다.
- 클라이언트 UI가 메타데이터 체계 변화에 견고하게 대처하며, 추후 후보 리스트·불확실성 UX 확장 기반을 마련한다.

## 3. 범위

| 범위 내 | 범위 외 |
| --- | --- |
| 게이트웨이 메타데이터 파서 개선 | IRL 모델/랭커 알고리즘 변경 |
| 피드백 API 경로/version 동기화 | 새로운 UI 레이아웃 전면 개편 |
| 피드백 실패 재시도/로그 | 피드백 대시보드 구현 |
| Trace/Reason 표기 UX 개선(툴팁) | 후보 리스트 UI 완성 (추후 티켓 참조) |

## 4. 이해관계자

- **프론트엔드**: 파서/피드백 로직, UI/UX 개선
- **백엔드(AI Gateway)**: API 버전 경로 정합, 응답 메타데이터 포맷
- **데이터/Observability**: 피드백 이벤트, Trace 로깅 확인
- **PM/QA**: 요구사항 우선순위 및 회귀 테스트 계획

## 5. 요구사항

### 5.1 필수 (Must)

1. 피드백 경로를 사양에 맞게 `/v1/irl/feedback`으로 통일하고, 환경 변수/설정으로 오버라이드 가능하게 만든다.@src/lib/aiGateway.ts#294-316
2. `requestGatewayCompletion`의 `raw` 응답으로부터 메타데이터를 계층적으로 파싱한다. 값 탐색 우선순위 예시: `raw.metadata` → `raw.message.metadata` → `raw.message.data.metadata` → `raw.metadata.chosen`.
3. 메타데이터가 비어있을 때도 UI가 조용히 동작하되, 내부적으로는 경고 로그를 남겨 조기 탐지한다.
4. 피드백 전송 실패 시 최소한 콘솔 경고(또는 Sentry 이벤트)를 남기고, 사용자가 반복 클릭했음을 롤백하지 않도록 한다.@src/pages/Chat.tsx#162-193
5. Trace ID 전체를 툴팁 등에서 확인할 수 있도록 expose 하며, 배지는 8자 요약 유지.

### 5.2 선택 (Should/Nice-to-have)

1. 피드백 전송을 위한 재시도 큐(백오프 3회)를 도입하고, 실패 시 사용자에게 스낵바로 안내한다.
2. `sendFeedback` 동적 import 제거 및 상단 정적 import로 번들 최적화.
3. `computeHistoryHash` 결과를 동일 히스토리에 대해 메모이즈하여 재생성 시 불필요한 SHA-256 호출 감소.
4. 향후 후보 리스트/불확실성 표시용으로 `candidateSet` 빈 배열을 메시지에 저장하는 로직 마련.

## 6. 사용자 스토리 & 시나리오

| ID | 스토리 | 만족 기준 |
| --- | --- | --- |
| US-01 | IRL 정책을 켠 사용자가 좋아요를 누르면 서버에 성공적으로 피드백이 기록된다. | `/v1/irl/feedback` 202 응답, 실패 시 콘솔 경고/재시도 큐에 적층 |
| US-02 | IRL 응답 메타 포맷이 변경되어도 배지/툴팁에서 policy/score가 정상 표시된다. | 다양한 샘플 payload(mock) 테스트 통과 |
| US-03 | Trace ID 전체를 QA가 쉽게 복사해 서버 로그와 상관 분석할 수 있다. | 배지 호버 시 전체 Trace ID/Reason 표시 |

## 7. 구현 계획

1. **API 레이어 (1d)**
   - `sendFeedback` URL 상수화(`FEEDBACK_ENDPOINT = "/v1/irl/feedback"`).
   - 환경변수 `VITE_IRL_FEEDBACK_PATH`를 도입해 배포 환경에서 조정 가능하도록 함.
   - 동적 import 제거 및 함수 시그니처 정리.
2. **메타데이터 파서 (1.5d)**
   - `extractMetadata` 헬퍼 작성: 다양한 키 탐색 + snakeCase/camelCase 양쪽 대응.
   - `requestGatewayCompletion` 호출 이후 assistant 메시지 작성 시 헬퍼 사용.
   - 메타 누락 시 `console.warn("Missing IRL metadata", raw)` 로그.
3. **UI/UX (1d)**
   - Trace ID 배지 툴팁 추가 (`Tooltip` 활용) 및 전체 값 복사 버튼 옵션.
   - Reason 존재 시 Tooltip으로 노출.
4. **피드백 신뢰성 (2d)**
   - `sendFeedback` Promise 실패 시 `console.warn` + in-memory queue.
   - 재시도 큐: exponential backoff (0.5/1/2초) + 최대 3회.
   - 재시도 실패 후엔 한 번만 토스트 경고 표시.
5. **테스트 & 문서 (1d)**
   - 스토리북/유닛테스트: 메타 파서와 배지 UI snapshot.
   - 테스팅 모크: 다양한 응답 포맷 fixture 구성.
   - PRD/스웨거/텔레메트리 문서 반영 (현재 문서 최신화).

총 예상: **6.5일** (FE 3.5d, BE 1d, Observability 1d, QA 1d)

## 8. QA & 수용 기준

- IRL 토글 ON, 게이트웨이 모의 응답에서 정책/점수 필드가 모두 노출되는지 확인.
- IRL 메타 필드 누락 fixture로 테스트 시 콘솔 경고 발생, UI 배지는 비표시.
- `/v1/irl/feedback` 장애 상황(mock 500)에서 재시도 후 경고 알림이 표시되고, 사용자 Like 토글 상태는 유지.
- 실제 Trace ID가 API/로그 간 일치하는지 관측 도구(OpenTelemetry)로 확인.

## 9. 리스크 & 완화

| 리스크 | 영향 | 완화 |
| --- | --- | --- |
| Gateway 응답 포맷 추가 변경 | 메타 파서 계속 수정 필요 | 스키마/계약 문서화를 백엔드와 동시 진행, 회귀 테스트 강화 |
| 재시도 큐 메모리 증가 | 장시간 오프라인 시 이벤트 누적 | 최대 큐 크기 제한 및 브라우저 복귀 시 flush |
| `/v1/irl/feedback` 404 발생 | 즉시 피드백 손실 | 환경 변수로 경로 설정 가능, 배포 체크리스트에 API 헬스 포함 |

## 10. 후속 작업 (향후)

- 정책 목록 동적 로딩 및 Tooltip 설명(@docs/irl-hybrid-backlog.md BL-01, BL-02).
- 후보 리스트 UI 및 불확실성 Tooltip 구현(BL-05, BL-06).
- 피드백 이벤트 재생성/복사/저장에도 확대 적용(BL-08).
