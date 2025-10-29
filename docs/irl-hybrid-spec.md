# IRL 하이브리드 재랭킹 및 관측성 확장 세부 스펙

## 1. 개요

- **목표**: IRL 기반 재랭킹·제약 정책을 LLM 챗봇 파이프라인과 통합하고, 투명성·안전성·관측성을 확보한다.
- **가치**:
  - 전문가 가이드 모드를 운영 단계로 승격하기 위한 품질/안전 장치.
  - 사용자 신뢰 제고(점수/정책 이유 표시).
  - 정책 튜닝과 회귀 감시 자동화.
- **범위**: 클라이언트, Gateway, IRL 서빙, 텔레메트리, 피드백 루프, QA.
- **비범위**: 신규 IRL 알고리즘 연구, UI 브랜딩 개편, 외부 파트너 연동.

## 2. 이해관계자

| 그룹                 | 책임                                         |
| -------------------- | -------------------------------------------- |
| 제품                 | 우선순위, 정책 설명 콘텐츠, 베타 운영        |
| 프론트엔드           | 설정 UI, 메시지 메타데이터, 피드백 이벤트    |
| 백엔드(AI Gateway)   | API 계약 구현, 재랭킹 파이프라인, 텔레메트리 |
| 데이터/ML            | IRL·안전 모델 학습/검증, 오프라인 평가      |
| DevOps/Observability | Trace/Metric 파이프라인, 알람 설정           |

## 3. 기능 개요

1. **정책 설정 확장**: 정책 버전 목록/설명 동적 로딩, 안전 규칙 안내.
2. **재랭킹 메타데이터 계약**: 요청/응답 공통 스키마(`irlScore`, `safetyScore`, `uncertainty`, `reason`).
3. **2단계 재랭킹 파이프라인**: LLM 후보 → 경량 랭커 → IRL 보상 → 안전 게이트.
4. **불확실성 기반 폴백**: 엔트로피/온도/안전 점수 임계 위반 시 거부·대안 제시.
5. **클라이언트 투명성 UI**: 선택 응답의 점수·정책, 대체 후보 리스트 표시.
6. **관측성·피드백 루프**: trace_id, latency, 후보 정보 로깅 및 사용자 피드백 이벤트 수집.
7. **오프라인 평가 자동화**: nDCG/Recall@k/Safety/ECE 대시보드와 회귀 알림.

## 4. 세부 요구사항

### 4.1 클라이언트

- 정책 Select는 `GET /irl/policies` 결과를 사용하며 정책 설명/규칙/최종 변경일을 Tooltip에 표기.
- `ChatMessage`는 선택 응답 카드에 `정책명`, `IRL 점수`, `안전 점수` 뱃지를 노출하고, “후보 보기” 토글로 상위 k 후보와 근거(reason)를 표시.
- 거부 상태(`metadata.chosen.reason === "reject"`)일 때 별도 경고 카드, 대안 질문 버튼 노출.
- 메시지 모델 확장: `policyId`, `irlScore`, `safetyScore`, `rank`, `traceId`, `reason`, `candidateSet`.
- `handleLikeToggle` 등 피드백 이벤트 발생 시 `POST /feedback` 호출(재시도 큐 포함).

### 4.2 Gateway/서버

- `requestGatewayCompletion`는 신표준 메타데이터 필드를 포함하여 전송.
- Gateway는 LLM 후보(k≤3)를 생성 후 `fast_reranker`(임베딩 기반)와 `irl_policy` 앙상블로 최종 후보 선택.
- `uncertainty.entropy` 또는 `safetyScore`가 임계 초과 시 거부 응답 생성.
- 응답 메타데이터에 후보 리스트, 점수, 정책, 이유, trace_id 포함.
- 정책 목록/설명 API, 피드백 수집 API, 텔레메트리 익스포터 구현.

### 4.3 텔레메트리 & 피드백

- 모든 요청/응답에 `trace_id`, `policyId`, `candidateCount`, `chosenRank`, `latency` 기록.
- OpenTelemetry Trace + Metric + Log 연동. 주요 지표: `ai.irl.latency`, `ai.irl.chosen_rank`, `ai.irl.uncertainty.entropy`.
- 피드백 이벤트(`like`, `dislike`, `regenerate`)를 로그/데이터 웨어하우스로 전송해 재학습 소재 확보.

### 4.4 오프라인 평가

- 배치 파이프라인: 후보·점수·피드백 결합 후 `nDCG@k`, `Recall@k`, `SafetyAvoidRate`, `ECE`, `Latency` 계산.
- 대시보드(예: Grafana/Looker) 위젯 구성 및 임계 알람 설정.

## 5. 비기능 요구사항

- **성능**: 평균 응답 지연 추가 ≤ 500ms, P95 ≤ 900ms.
- **가용성**: IRL API 실패 시 LLM 기본 응답으로 섬세한 폴백.
- **보안**: 정책/피드백 API 인증, PII 제거, 로그 마스킹.
- **확장성**: 후보 수 k, 임계값 등을 Feature Flag/Config로 제어.

## 6. QA & 승인 기준

- IRL 비활성 상태와 기존 동작 완전 동일 (회귀 테스트 통과).
- IRL 활성 상태에서 응답 메타데이터가 프론트에 반영되고 UI가 정상 렌더.
- 거부 시나리오, 정책 전환, 재생성, 피드백 이벤트가 사양대로 동작.
- 텔레메트리 대시보드에서 지표가 실시간 집계되고 알람 정상 작동.

## 7. 릴리스 전략

1. **Dev**: 전 기능 통합, 테스트 데이터로 검증.
2. **Staging**: 내부 상담사 테스트, 텔레메트리 대시보드 검증.
3. **Beta**: 제한 유저그룹, 거부/폴백 모니터링.
4. **GA**: KPI 만족 시 전체 롤아웃. Feature Flag 유지.

## 8. 관련 문서 & 산출물

- `docs/api/irl-hybrid-openapi.yaml`
- `docs/api/swagger-ui.html`
- `docs/telemetry/irl-telemetry-schema.md`
- `docs/irl-hybrid-backlog.md`

## 9. 핵심 수식 및 공식

### 9.1 하이브리드 재랭킹 점수

- **정의**: 후보 \(c_i\)의 최종 점수 \(S(c_i)\)는 다음과 같이 계산한다.
  \[
  S(c_i) = w_{\text{irl}} \cdot R_{\text{irl}}(c_i) + w_{\text{safety}} \cdot R_{\text{safety}}(c_i) + w_{\text{llm}} \cdot \log p_{\text{LLM}}(c_i)
  \]
- **기호 설명**:

  | 기호 | 의미 | 범위/비고 |
  | --- | --- | --- |
  | \(R_{\text{irl}}(c_i)\) | IRL 보상 모델 점수 | \(0 \le R_{\text{irl}} \le 1\) |
  | \(R_{\text{safety}}(c_i)\) | 안전 평가 점수 | 1에 가까울수록 안전 |
  | \(\log p_{\text{LLM}}(c_i)\) | LLM 후보 생성 로그 확률 | 발생 확률 기반 품질 |
  | \(w_{\*}\) | 가중치 | \(w_{\text{irl}} + w_{\text{safety}} + w_{\text{llm}} = 1\) |

  운영 정책에 따라 가중치를 튜닝하며, IRL 점수와 안전 점수는 Min-Max 정규화 후 입력한다.

### 9.2 불확실성 추정

- **엔트로피 기반 불확실성**:
  \[
  H = - \sum_{i=1}^{k} p_i \log p_i
  \]
  여기서 \(p_i = \frac{\exp(\alpha_i / T)}{\sum_j \exp(\alpha_j / T)}\) 는 온도 \(T\)를 적용한 softmax 확률이며, \(\alpha_i\)는 재랭커 점수이다.
- **안전 확률 보정**: Platt scaling으로
  \[
  \sigma(a_i) = \frac{1}{1 + e^{-(\beta_0 + \beta_1 a_i)}}
  \]
  을 계산하여 안전 분류기의 calibration을 수행한다.

### 9.3 안전 게이트

- **폴백 조건**: 안전 점수 임계값 \(\tau_s\), 엔트로피 임계값 \(\tau_h\)에 대해
  \[
  \text{reject}(c_{\text{best}}) = \big( R_{\text{safety}}(c_{\text{best}}) < \tau_s \big) \lor \big( H > \tau_h \big)
  \]
- 조건을 만족하면 대체 안내 메시지를 반환하고, 메타데이터 `reason`에 거부 사유(예: `safety_threshold`, `high_entropy`)를 기록한다.

### 9.4 히스토리 해시

- **정의**: 직렬화된 기록 \(\text{serialize}(M)\)에 대해 SHA-256 해시를 사용하고, Web Crypto 미지원 환경에서는 `cyrb53` 53-bit 해시를 사용한다.
  \[
  \text{historyHash} = \text{SHA256}\big( \text{serialize}(M) \big)
  \]

### 9.5 품질 지표

- **nDCG@k**:
  \[
  \text{nDCG@k} = \frac{1}{\text{IDCG@k}} \sum_{i=1}^{k} \frac{2^{rel_i}-1}{\log_2(i+1)}
  \]
- **Recall@k**:
  \[
  \text{Recall@k} = \frac{|\{i \le k \mid rel_i = 1\}|}{|\{i \mid rel_i = 1\}|}
  \]
- **안전 위반 회피율**:
  \[
  \text{SafetyAvoidRate} = 1 - \frac{N_{\text{violation}}}{N_{\text{requests}}}
  \]
- **ECE (Expected Calibration Error)**:
  \[
  \text{ECE} = \sum_{m=1}^{M} \frac{|B_m|}{n}\big|\text{acc}(B_m) - \text{conf}(B_m)\big|
  \]

## 10. 구현 진척 현황 (2025-10-29)

- ✅ 히스토리 해시 및 `historyHash` 메타데이터 전송 (클라이언트 `computeHistoryHash`).
- ✅ IRL 응답 메타(정책 ID, 점수, Trace 등) 파싱 및 메시지 스토어/배지 UI 반영.
- ✅ 좋아요 토글 시 `/feedback` 엔드포인트로 사용자 피드백 이벤트 송신.
- ⚠️ 정책/피드백 API는 현재 `/irl/policies`, `/feedback` 경로 사용 – `/v1/irl/...` 버전 경로 도입 시 코드 동기화 필요.
- ⏳ 후보 리스트 UI, 정책 목록 동적 로딩, 불확실성 기반 거부 UX는 미구현 상태로 남아 있음.
