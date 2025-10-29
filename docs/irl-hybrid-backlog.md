# IRL 하이브리드 확장 작업 백로그

| ID | Epic | 작업명 | 설명 | 담당 | 예상 기간 | 선행 조건 | 상태 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BL-01 | 설정 UI | 정책 목록 API 연동 | `GET /v1/irl/policies` 호출 후 Select 옵션/Tooltip 데이터 바인딩 | FE | 2d | API 가용 | Todo |
| BL-02 | 설정 UI | 정책 설명 Tooltip 확장 | 정책 설명/안전 요약/업데이트 일자 UI 반영 | FE | 1d | BL-01 | Todo |
| BL-03 | 메시지 모델 | Message 타입 메타데이터 확장 | `policyId`, `irlScore`, `safetyScore`, `rank`, `traceId`, `reason`, `candidateSet` 필드 추가 | FE | 2d | - | Todo |
| BL-04 | 메시지 UI | 선택 응답 점수/정책 뱃지 표시 | ChatMessage 카드에 점수/정책 노출, 접근성 반영 | FE | 2d | BL-03 | Todo |
| BL-05 | 메시지 UI | 후보 리스트 토글 구현 | 후보 k개 리스트 및 근거(reason) 펼침 UI | FE | 3d | BL-03 | Todo |
| BL-06 | 메시지 UI | 거부 응답 UX | 거부 사유 및 대안 질문 버튼 UI | FE | 2d | BL-03 | Todo |
| BL-07 | 피드백 | 피드백 API 연동 | `POST /v1/irl/feedback` 호출 및 재시도 큐 | FE | 2d | API 가용 | Todo |
| BL-08 | 피드백 | UI 이벤트 계측 | 좋아요/싫어요/재생성 이벤트 로깅, 토스트 | FE | 1d | BL-07 | Todo |
| BL-09 | Gateway | 메타데이터 계약 업데이트 | 요청/응답 스키마 및 historyHash 캐시키 적용 | BE | 3d | Spec 확정 | Todo |
| BL-10 | Gateway | 2단계 재랭킹 파이프라인 | generator → fast_reranker → irl_policy → safety 게이트 | BE/ML | 7d | BL-09 | Todo |
| BL-11 | Gateway | 불확실성/폴백 로직 | 엔트로피/안전 임계값 검사 및 거부 응답 생성 | BE | 3d | BL-10 | Todo |
| BL-12 | Gateway | 후보/점수 응답 메타 구성 | chosen/candidates/uncertainty/latency 등 JSON 채움 | BE | 2d | BL-10 | Todo |
| BL-13 | Gateway | 정책 목록 API 구현 | `/v1/irl/policies` 엔드포인트 | BE | 2d | - | Todo |
| BL-14 | Gateway | 피드백 수신 API | `/v1/irl/feedback` 비동기 큐 전송 | BE | 2d | - | Todo |
| BL-15 | ML | 경량 랭커 모델 학습 | 임베딩 기반 SRR 모델 학습 및 서빙 | ML | 5d | 데이터 준비 | Todo |
| BL-16 | ML | IRL 보상 앙상블 튜닝 | 정책 파라미터/안전 점수 캘리브레이션 | ML | 5d | BL-10 | Todo |
| BL-17 | ML | 불확실성 추정 보정 | 온도 스케일링/깔끔한 entropy 계산 | ML | 3d | BL-16 | Todo |
| BL-18 | 텔레메트리 | OTEL 트레이스/메트릭 적용 | trace_id, stage span, metrics 수집 | DevOps | 4d | BL-09 | Todo |
| BL-19 | 텔레메트리 | 로그 스키마 적용 | 구조화 로그/마스킹 | DevOps | 2d | BL-18 | Todo |
| BL-20 | 텔레메트리 | 대시보드 & 알람 | Grafana/Looker 위젯 및 임계 설정 | DevOps | 3d | BL-18 | Todo |
| BL-21 | 데이터 | 피드백 웨어하우스 적재 | ETL 테이블 생성 및 스케줄 | Data | 3d | BL-14 | Todo |
| BL-22 | 데이터 | 오프라인 평가 파이프라인 | nDCG, Recall, Safety, ECE 계산 배치 | Data | 5d | BL-21 | Todo |
| BL-23 | QA | 시나리오 테스트 스크립트 | 거부/폴백/정책전환/재생성 케이스 | QA | 3d | BL-04~BL-12 | Todo |
| BL-24 | QA | 퍼포먼스/부하 테스트 | latency, 폴백율, 캐시 성능 검증 | QA | 3d | BL-10 | Todo |
| BL-25 | 릴리스 | Beta 롤아웃 플랜 | 플래그, 사용자 안내, 모니터링 체크리스트 | PM | 2d | QA 완료 | Todo |
