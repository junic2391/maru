# Maru

랜덤 매칭 화상통화 서비스. pnpm + Turborepo 모노레포.

## 문서 4종

| 문서 | 위치 | 답하는 질문 |
|---|---|---|
| Plan.md | `/Users/junic/Documents/workspace/projects/maru-journal/source/Plan.md` | 40일 안에 무엇을, 왜, 어떤 순서로 |
| Concept.md | `/Users/junic/Documents/workspace/projects/maru-journal/source/Concept.md` | 제품이 무엇이고 기술적으로 어떻게 동작하는가 |
| BrandGuide.md | `/Users/junic/Documents/workspace/projects/maru-journal/source/BrandGuide.md` | 이름·서사·목소리 |
| Design.md | `/Users/junic/Documents/workspace/projects/maru-journal/source/Design.md` | 화면에서 어떻게 보이는가 |

통째로 읽지 말고 `.claude/skills/`의 요약을 먼저 참고한다. 상세가 필요하면 스킬이 가리키는 라인만 읽는다.

**ADR 번호의 정본은 Plan.md 11장이다.** 다른 문서는 인용만 한다. 새 결정이 생기면 Plan 11장에 먼저 추가한다.

**태스크 ID(M0-XX·M1-XX)의 정본은 `maru-journal/guide/Backlog.md`다.** 가이드와 `phase-status.md`는 인용만 한다.

`/Users/junic/Documents/workspace/projects/maru-journal/guide/`의 `Workflow.md`·`Onboarding.md`·`Backlog.md`·`Build-Phase0.md`(인덱스, 태스크별 상세는 `Phase0/M0-01.md`~`M0-10.md`)·`Build-Phase1.md`(인덱스, 태스크별 상세는 `Phase1/M1-01.md`~`M1-07.md`)·`Glossary.md`는 **사용자용 문서**다. 사용자가 명시적으로 가리킬 때만 읽는다 — 작업 규칙은 이 파일과 스킬에 있다.

`maru-journal`은 이 레포 밖의 **비공개** 저장소다(계획 문서·ADR·거부 기록 등). `docs/adr`·`docs/ai-rejections.md`·`docs/kpi.md`·`docs/specs`는 전부 그 안에 있다 — 이 레포 안에 `docs/`를 새로 만들지 않는다.

## 명령

```
pnpm build / dev / lint / typecheck / test   # turbo run <task>
pnpm --filter @maru/web <script>              # 특정 패키지만
```

## 커밋·브랜치

- 세션 하나 = PR 하나. 태스크(M0-XX) 단위로 작게 커밋한다.
- `main`에 직접 push하지 않고 브랜치 + PR. 실습성 브랜치는 끝나면 `gh pr close --delete-branch`로 정리.
- 커밋 메시지는 conventional commits 스타일(`feat:`, `fix:`, `chore:`, `ci:`).
- 브랜치명은 `<type>/<태스크ID(있으면)>-<영문 kebab 설명>` (예: `feat/m1-04-call-screen`, `chore/pr-review-security-check-tooling`). `type`은 커밋 메시지와 같은 conventional commits 타입. 태스크 ID만 단독으로 쓰지 않는다(예: `M1-04` 금지).
- **PR 설명(Summary·AI 사용 기록 포함)에는 이 PR의 핵심 기능과 직접 관련된 내용만 담는다.** 같은 세션에서 곁들여 고친 스킬·가이드 문서·설정 등 부수적인 변경은 PR 설명에 언급하지 않는다 — 각 커밋 메시지로 충분하다.

**PR 만들기 직전 순서**: (보안·인증·토큰 관련 변경이면) `/security-check` → `/pr-review` → 지적 사항 반영(거부한 항목은 `/reject`) → `/ai-log` → (실측값이 바뀌었으면) `/kpi`. 순서를 지켜야 `/ai-log`의 "거부한 제안과 이유"에 리뷰 단계의 이력까지 잡힌다.

## 방어 구역 — 직접 작성, AI는 리뷰어로만

`.claude/defense-zones.json`의 글롭에 걸리는 경로는 `PreToolUse` 훅이 편집을 차단한다. 대상: WebRTC 연결 상태 머신, 매칭 큐·Redis 원자적 페어링, AudioWorklet PCM 처리·재생 스케줄러, 자막 partial/final 전이, 재연결 백오프.

> ⚠️ 현재 이 글롭은 **잠정치**다. ADR-004(FSD 폴더 구조 채택 범위)가 확정되지 않아 실제 파일 경로 대신 키워드 패턴으로만 걸어뒀다. 방어 구역 코드를 처음 만들 때 이 목록을 실제 경로로 갱신할 것.

판단 기준: "이걸 면접에서 백지로 다시 짜야 하나?" 그렇다면 방어 구역이다.
