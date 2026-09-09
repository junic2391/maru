#!/usr/bin/env node
// SessionStart — 현재 Phase·DoD·컷라인을 세션 시작 시 짧게 주입한다. Workflow.md 3-3.
const fs = require("fs");
const path = require("path");

const repoRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const statusPath = path.join(repoRoot, ".claude", "phase-status.md");

try {
  const content = fs.readFileSync(statusPath, "utf8").trim();
  if (content) console.log(content);
} catch {
  // 상태 파일이 없으면 조용히 넘어간다.
}
process.exit(0);
