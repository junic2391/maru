---
description: AI 제안을 거부한 순간을 maru-journal/docs/ai-rejections.md에 기록한다
---

지금 막 사용자가 AI(나)의 제안을 거부했다: "$ARGUMENTS"

`/Users/junic/Documents/workspace/projects/maru-journal/docs/ai-rejections.md`가 없으면 헤더(`# AI 제안 거부 기록`)와 함께 새로 만든다. 있으면 맨 아래에 다음 형식으로 한 항목을 append한다:

```markdown
## YYYY-MM-DD — <한 줄 요약>

- 상황:
- AI가 제안한 것:
- 거부한 이유:
```

날짜는 오늘 날짜(currentDate 참고)로, 나머지 필드는 이번 대화에서 실제로 있었던 상황·제안·이유를 1~2문장씩 짧게 채운다. 과장하거나 미화하지 않는다 — Plan.md 10-3이 요구하는 "거부 사례 3건 이상"의 실제 근거가 되는 기록이다.
