import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["**/*.spec.ts", "**/*.spec.tsx"],
    exclude: ["node_modules", ".next"],
    passWithNoTests: true,
  },
});
