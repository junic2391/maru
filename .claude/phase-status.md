# 현재 상태 (수동 갱신)

- Phase: 0 (설계·스파이크, D1–3)
- 완료: M0-01 ~ **M0-09**. ADR-001~004가 `maru-journal/docs/adr/`에 있다 (001·002·003 채택됨, 004는 **제안됨** — M1-04에서 확정)
- 다음: **M0-10 (인프라 견적)** — `Build-Phase0.md` M0-10 절을 따라 후보 3곳 요금 조사 → `docs/specs/m0-10-infra-estimate.md` → `Plan.md` 9-2 표
- 이번 Phase DoD: ADR 4건 ✅ / CI 5분 이내 통과 ✅ / 실기기 WebView `getUserMedia` 성공 ✅
- 컷라인: Plan.md 5-3 — Should가 밀리면 Could부터 자른다

**태스크 ID의 정본은 `maru-journal/guide/Backlog.md`다.** 진행 상태도 거기 표를 함께 갱신한다.

주의: 방어 구역 경로(`.claude/defense-zones.json`)는 **ADR-004가 `제안됨` 상태라 여전히 키워드 기반 잠정치**다. M1-04에서 상태 머신 파일 경로를 정할 때 실경로로 갱신하고 ADR-004를 `채택됨`으로 바꾼다.

> 이 파일은 자동 갱신되지 않는다. Phase나 진행 중인 태스크가 바뀌면 직접 고친다.
