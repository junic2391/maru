#!/usr/bin/env node
// PostToolUse(Edit|Write) — 변경된 파일이 속한 패키지에서 typecheck + lint를 즉시 돌린다. Workflow.md 3-3.
// 패키지마다 lint 도구가 다를 수 있어(예: apps/server는 oxlint, 나머지는 eslint) 파일 단위가 아니라
// 각 패키지에 이미 정의된 "typecheck"/"lint" npm 스크립트를 그대로 실행한다.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { readStdinJson, findNearestPackage } = require("./lib");

const repoRoot = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const input = readStdinJson();
const filePath = input?.tool_input?.file_path;
if (!filePath) process.exit(0);

const ext = path.extname(filePath);
if (![".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"].includes(ext)) process.exit(0);

const absPath = path.resolve(filePath);
const pkg = findNearestPackage(absPath, repoRoot);
if (!pkg) process.exit(0);

let pkgJson;
try {
  pkgJson = JSON.parse(fs.readFileSync(path.join(pkg.dir, "package.json"), "utf8"));
} catch {
  process.exit(0);
}

const errors = [];
function run(label, script) {
  if (!pkgJson.scripts?.[script]) return;
  const result = spawnSync("pnpm", ["run", script], { cwd: pkg.dir, encoding: "utf8" });
  if (result.status !== 0) {
    errors.push(`--- ${label} (${pkg.name}) ---\n${result.stdout}\n${result.stderr}`.trim());
  }
}

run("typecheck", "typecheck");
run("lint", "lint");

if (errors.length) {
  console.error(errors.join("\n\n"));
  process.exit(2);
}
process.exit(0);
