# apps/server 규칙

- NestJS 모듈은 도메인 단위로 나눈다(예: `matching`, `signaling`, `auth`). 모듈 간 직접 import 대신 각 모듈의 공개 서비스만 참조한다.
- WebSocket 이벤트 payload 타입은 이 패키지에서 직접 정의하지 않고 `@maru/shared-types`가 정본이다. 새 이벤트가 필요하면 `shared-types`에 먼저 추가한다.
- 매칭 큐·Redis 원자적 페어링(Lua 스크립트)은 방어 구역이다(루트 CLAUDE.md). 초안도 작성하지 말고, 완성 후 부하테스트 시나리오 작성만 돕는다.
- 로컬 실행: `pnpm --filter @maru/server dev`. 테스트: `pnpm --filter @maru/server test`(vitest).
- lint는 oxlint(`pnpm --filter @maru/server lint`) — 루트 ESLint 설정과 별개다 (M0-05에서 의도적으로 분리한 결정, 이유는 Build-Phase0-1.md M0-05 참고).
