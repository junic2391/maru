#!/usr/bin/env node
// PreToolUse(Edit|Write) — 방어 구역 경로 편집을 차단한다. Workflow.md 3-3, 4-1.
const fs = require("fs");
const path = require("path");
const { readStdinJson } = require("./lib");

const repoRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const zonesPath = path.join(repoRoot, ".claude", "defense-zones.json");

const input = readStdinJson();
const filePath = input?.tool_input?.file_path;
if (!filePath) process.exit(0);

const relPath = path.relative(repoRoot, path.resolve(filePath)).split(path.sep).join("/");

let zones;
try {
  zones = JSON.parse(fs.readFileSync(zonesPath, "utf8"));
} catch {
  process.exit(0); // 방어 구역 설정이 없으면 통과
}

// 표기법 차이를 흡수한다. CallStateMachine.tsx / call-state-machine.ts / call_state_machine.ts 가
// 모두 keyword "statemachine"에 걸리도록 영문자·숫자만 남기고 소문자로 맞춘 뒤 비교한다.
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizedPath = normalize(relPath);

const matched = (zones.zones || []).find(
  (z) => relPath.startsWith(z.prefix) && normalizedPath.includes(normalize(z.keyword))
);
if (matched) {
  console.error(
    `방어 구역 편집 차단: "${relPath}"가 defense-zones.json의 "${matched.prefix}*${matched.keyword}*" 규칙(${matched.reason})에 걸립니다.\n` +
      `이 경로는 직접 작성 대상입니다(루트 CLAUDE.md 참고). 완성된 코드에 대한 리뷰만 돕고, 초안 작성은 하지 마세요.\n` +
      `의도적으로 이 차단을 풀고 싶다면 사용자가 .claude/defense-zones.json을 직접 수정해야 합니다.`
  );
  process.exit(2);
}

process.exit(0);
