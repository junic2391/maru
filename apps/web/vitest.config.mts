import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "./",
    include: ["**/*.spec.ts", "**/*.spec.tsx"],
    exclude: ["node_modules", ".next"],
    passWithNoTests: true,
  },
});
