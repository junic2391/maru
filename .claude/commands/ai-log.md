---
description: PR 생성 직전, AI 사용 기록 4항목을 diff 기준으로 채운다
---

`adr-format` 스킬의 PR 템플릿 형식을 사용한다. 현재 브랜치와 base(main) 사이의 `git diff`, `git log`를 근거로 아래를 채워 출력한다(파일로 저장하지 않고 그대로 답변에 출력 — 사용자가 PR 본문에 붙여넣는다):

```markdown
## AI 사용 기록
- 도구:
- 위임한 범위:
- 직접 작성한 범위:
- 거부한 제안과 이유:
```

"거부한 제안과 이유"는 `/Users/junic/Documents/workspace/projects/maru-journal/docs/ai-rejections.md`에 이번 작업 기간과 겹치는 항목이 있으면 요약해서 채운다. 없으면 빈 칸으로 두고 사용자에게 알린다 — 지어내지 않는다.
