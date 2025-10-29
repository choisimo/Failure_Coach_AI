# IRL 텔레메트리 & 피드백 스키마

## 1. 로그/트레이스 필드 (JSON structured logging)
| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `trace_id` | string | OpenTelemetry trace identifier, 요청-응답-피드백 연동 |
| `span_id` | string | 세부 작업 span 구분 |
| `conversation_id` | string | 대화 식별자 |
| `policy_id` | string | 적용된 IRL 정책 ID |
| `policy_version` | string | 정책 버전, `metadata.policyVersion` |
| `candidate_count` | int | 생성된 후보 수 |
| `chosen_rank` | int | 최종 선택 후보의 순위(1-base) |
| `irl_score` | float | 최종 후보 IRL 점수 |
| `safety_score` | float | 최종 후보 안전 점수 |
| `uncertainty_entropy` | float | 선택 후보 엔트로피 |
| `uncertainty_temperature` | float | 온도 스케일링 값 |
| `fallback_reason` | string | 거부/폴백 사유 (`null` 허용) |
| `latency_ms` | int | 총 소요 시간 |
| `generator_latency_ms` | int | LLM 후보 생성 소요 시간 |
| `reranker_latency_ms` | int | 경량 랭커 소요 시간 |
| `irl_latency_ms` | int | IRL 정책 평가 소요 시간 |
| `safety_latency_ms` | int | 안전 평가 소요 시간 |
| `user_action` | string | 클라이언트 피드백 이벤트 (`like`, `dislike`, `regenerate`) |
| `candidate_id` | string | 피드백 대상 후보 ID |
| `message_id` | string | 메시지 ID |
| `feedback_payload` | object | IRL/안전 점수 스냅샷, rank |
| `env` | string | 환경(dev/staging/prod) |
| `service` | string | 서비스명 (gateway, reranker 등) |

### 예시 로그 엔트리
```json
{
  "trace_id": "03d2f...",
  "span_id": "b912...",
  "conversation_id": "conv-123",
  "policy_id": "irl-v1",
  "policy_version": "v1",
  "candidate_count": 3,
  "chosen_rank": 1,
  "irl_score": 0.82,
  "safety_score": 0.97,
  "uncertainty_entropy": 1.21,
  "uncertainty_temperature": 0.73,
  "fallback_reason": null,
  "latency_ms": 430,
  "generator_latency_ms": 250,
  "reranker_latency_ms": 60,
  "irl_latency_ms": 80,
  "safety_latency_ms": 40,
  "env": "prod",
  "service": "gateway"
}
```

## 2. 메트릭 (OpenTelemetry Metrics)
| 메트릭 이름 | 타입 | 라벨 | 설명 |
| --- | --- | --- | --- |
| `ai.irl.requests` | Counter | `env`, `policy_id`, `status` | 총 요청 수와 성공/실패 구분 |
| `ai.irl.latency` | Histogram | `env`, `policy_id`, `stage` | stage별 지연 시간(ms) (`stage`: generator/reranker/irl/safety/total) |
| `ai.irl.uncertainty.entropy` | Gauge | `env`, `policy_id` | 엔트로피 평균 |
| `ai.irl.uncertainty.temperature` | Gauge | `env`, `policy_id` | 온도 스케일링 평균 |
| `ai.irl.chosen.rank` | Histogram | `env`, `policy_id` | 선택 순위 분포 |
| `ai.irl.fallback.count` | Counter | `env`, `policy_id`, `reason` | 거부/폴백 발생 빈도 |
| `ai.irl.feedback.count` | Counter | `env`, `policy_id`, `action` | 피드백 이벤트(좋아요/싫어요/재생성) |
| `ai.irl.feedback.latency` | Histogram | `env`, `policy_id` | 피드백 API 처리 시간 |
| `ai.irl.cache.hit_ratio` | Gauge | `env` | historyHash 캐시 히트율 |

## 3. 피드백 이벤트 저장 스키마 (Warehouse)
```
TABLE irl_feedback_events (
  event_id STRING PRIMARY KEY,
  trace_id STRING,
  conversation_id STRING,
  message_id STRING,
  candidate_id STRING,
  policy_id STRING,
  rank INT,
  irl_score FLOAT,
  safety_score FLOAT,
  uncertainty_entropy FLOAT,
  action STRING,
  client_timestamp TIMESTAMP,
  server_timestamp TIMESTAMP,
  env STRING
);
```
- `client_timestamp`: 브라우저에서 전송한 시간
- `server_timestamp`: 수신/저장 시각
- 후속 파이프라인에서 nDCG/Recall 계산 시 사용

## 4. 대시보드 추천 위젯
1. **Latency Breakdown**: stage별 히스토그램 + P95.
2. **Chosen Rank Heatmap**: 정책별 rank 분포.
3. **Safety Avoidance Rate**: `fallback.count / requests`.
4. **Uncertainty Monitor**: entropy/temperature 시계열.
5. **Feedback Trend**: action별 카운트 vs 점수.
6. **Cache Hit Ratio**: historyHash 효율.

## 5. 알람 정책
- P95 총 지연 > 900ms (5분 연속)
- 폴백 비율 > 5%
- 안전 점수 평균 < 0.8 (30분 이동)
- 피드백 중 `dislike` 비율 > 20%

## 6. 데이터 거버넌스
- PII 제외, message content는 메타데이터에서 제거.
- 로그 보존 기간: prod 30일, staging 7일.
- 접근 제어: Observability 그룹만 조회.
