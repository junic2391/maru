const fs = require("fs");
const path = require("path");

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function findNearestPackage(absFilePath, repoRoot) {
  let dir = path.dirname(absFilePath);
  while (dir.startsWith(repoRoot)) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.name) return { name: pkg.name, dir };
      } catch {
        // 무시하고 계속 위로
      }
    }
    if (dir === repoRoot) break;
    dir = path.dirname(dir);
  }
  return null;
}

module.exports = { readStdinJson, findNearestPackage };
