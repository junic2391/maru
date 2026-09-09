#!/usr/bin/env node
// Stop — 이번 세션에서 바뀐 파일이 속한 패키지의 테스트를 돌리고, 실패하면 턴 종료를 막는다. Workflow.md 3-3.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { readStdinJson, findNearestPackage } = require("./lib");

const repoRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const input = readStdinJson();

// 이미 Stop 훅으로 한 번 이어진 턴이면 다시 막지 않는다(무한 루프 방지).
if (input?.stop_hook_active) process.exit(0);

const diff = spawnSync("git", ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" });
if (diff.status !== 0 || !diff.stdout.trim()) process.exit(0);

const changedFiles = diff.stdout
  .split("\n")
  .filter(Boolean)
  .map((line) => line.slice(3).trim())
  .filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(f));

if (!changedFiles.length) process.exit(0);

const packages = new Map();
for (const relFile of changedFiles) {
  const absPath = path.join(repoRoot, relFile);
  if (!fs.existsSync(absPath)) continue;
  const pkg = findNearestPackage(absPath, repoRoot);
  if (pkg && !packages.has(pkg.name)) packages.set(pkg.name, pkg.dir);
}

const errors = [];
for (const [name, dir] of packages) {
  let pkgJson;
  try {
    pkgJson = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
  } catch {
    continue;
  }
  if (!pkgJson.scripts?.test) continue;
  const result = spawnSync("pnpm", ["run", "test"], { cwd: dir, encoding: "utf8" });
  if (result.status !== 0) {
    errors.push(`--- test (${name}) ---\n${result.stdout}\n${result.stderr}`.trim());
  }
}

if (errors.length) {
  console.error(
    `변경된 영역의 테스트가 실패했습니다. 고치기 전에는 멈추지 마세요.\n\n${errors.join("\n\n")}`
  );
  process.exit(2);
}
process.exit(0);
