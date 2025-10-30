# 마음 거울 위키

마음 거울 프로젝트의 제품 요구사항, 기술 사양, API 문서를 한곳에서 탐색할 수 있도록 구성한 MkDocs 기반 위키입니다.

- 좌측 내비게이션을 사용해 문서를 이동하세요.
- OpenAPI 스펙과 텔레메트리 스키마는 원본 파일로 제공되어, 코드 편집기에서 바로 확인할 수 있습니다.
- 메인 애플리케이션에 대한 소개는 [프로젝트 README](../README.md)를 참고하세요.

## 문서 개요

| 구분 | 문서 | 설명 |
| --- | --- | --- |
| 제품 기획 | [IRL 하이브리드 사양](./irl-hybrid-spec.md) | IRL 하이브리드 제품에 대한 상세 명세 |
| 제품 기획 | [IRL 하이브리드 백로그](./irl-hybrid-backlog.md) | 주요 작업 항목과 우선순위 |
| 제품 기획 | [IRL 리팩터링 PRD](./irl-refactor-prd.md) | 리팩터링 프로젝트 요구사항 |
| API | [OpenAPI 스펙](./api/irl-hybrid-openapi.yaml) | 하이브리드 엔드포인트 명세 |
| 텔레메트리 | [수집 스키마](./telemetry/irl-telemetry-schema.md) | 수집되는 이벤트 구조 |
| 참고 | [위키 인덱스(원본 HTML)](./wiki-index.html) | 기존 위키 콘텐츠 |

## 로컬 미리보기

```bash
pip install mkdocs mkdocs-material
mkdocs serve
```

로컬 서버가 시작되면 브라우저에서 `http://localhost:8000`으로 접속하여 문서를 확인할 수 있습니다.
