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

`/Users/junic/Documents/workspace/projects/maru-journal/guide/`의 `Workflow.md`와 `Build-Phase0-1.md`는 **사용자용 문서**다. 사용자가 명시적으로 가리킬 때만 읽는다 — 작업 규칙은 이 파일과 스킬에 있다.

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

## 방어 구역 — 직접 작성, AI는 리뷰어로만

`.claude/defense-zones.json`의 글롭에 걸리는 경로는 `PreToolUse` 훅이 편집을 차단한다. 대상: WebRTC 연결 상태 머신, 매칭 큐·Redis 원자적 페어링, AudioWorklet PCM 처리·재생 스케줄러, 자막 partial/final 전이, 재연결 백오프.

> ⚠️ 현재 이 글롭은 **잠정치**다. ADR-004(FSD 폴더 구조 채택 범위)가 확정되지 않아 실제 파일 경로 대신 키워드 패턴으로만 걸어뒀다. 방어 구역 코드를 처음 만들 때 이 목록을 실제 경로로 갱신할 것.

판단 기준: "이걸 면접에서 백지로 다시 짜야 하나?" 그렇다면 방어 구역이다.
