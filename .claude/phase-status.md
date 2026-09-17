# 현재 상태 (수동 갱신)

- Phase: **0 완료 (2026-09-10)** → 진행 중 Phase 1 (통화 코어 + 첫 배포, D4–11)
- 완료: M0-01 ~ M0-10 전부, **M1-01 (2026-09-10)**, **M1-02**(PR #5), **M1-03**(PR #6, 2026-09-13 — ADR-004 채택 확정, defense-zones.json 실경로화)
- 다음: **M1-04 · 통화 화면 완성** — `maru-journal/guide/Phase1/M1-04.md` (인덱스는 `Build-Phase1.md`)

> **2026-09-10 Phase 1 재편.** 12태스크 → **7태스크**. 자기 DoD를 자기 힘으로 검증할 수 없는 태스크들을 묶었다.
> 구→신 매핑표와 사유는 `maru-journal/guide/Backlog.md`의 「Phase 1 재편 기록」에, 태스크를 어디서 자르는지에 대한 규칙은 같은 문서 「1-1」에 있다.
> **이전 번호(M1-08~M1-12)는 더 이상 존재하지 않는다.** 기록물(`docs/specs/*`, `docs/ai-rejections.md`)에 남은 옛 ID는 당시 번호이므로 매핑표로 조회한다.

## Phase 0 DoD — 4항목 전부 충족

| 항목 | 결과 |
|---|---|
| ADR 4건 | ✅ `maru-journal/docs/adr/` ADR-001~004 (004는 M1-03에서 **채택됨**으로 확정) |
| 실기기 WebView `getUserMedia` | ✅ iPhone 12 Pro 3관문 통과 (`docs/specs/m0-08-result.md`) |
| CI가 lint+test를 5분 내 통과 | ✅ **실측 36초** |
| 인프라 견적 | ✅ `docs/specs/m0-10-infra-estimate.md` · 월 고정비 설계값 **$33.18** |

**태스크 ID의 정본은 `maru-journal/guide/Backlog.md`다.** 진행 상태도 거기 표를 함께 갱신한다.

## M1-02 착수 전 구멍 2개 — 해결됨 (M1-02에서 처리)

- `apps/server`에 `typecheck` 스크립트 추가됨.
- `apps/web`에 vitest `test` 스크립트 추가됨.

## Phase 1에서 처리할 미결 사항

- **ADR-017(인프라)은 M1-07 산출물이다.** M0-10은 숫자만 모았고, M1-06에서 실제로 띄우고 **M1-07에서 전송량을 실측한 뒤** 같은 태스크에서 기록한다 — 재고 나서 쓴다.
- 산정 보정치: **새 도구를 처음 연결하는 태스크는 +50%** (Phase 0에서 M0-05가 도구 간 버전 충돌로 초과한 경험)

> 이 파일은 자동 갱신되지 않는다. Phase나 진행 중인 태스크가 바뀌면 직접 고친다.
