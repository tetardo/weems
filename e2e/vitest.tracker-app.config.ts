import { defineConfig } from "vitest/config";

/** The real desktop tracker window (run by `pnpm test:tracker-app`, and on Windows by CI). */
export default defineConfig({
  test: {
    name: "tracker-app",
    root: import.meta.dirname,
    include: ["tracker-app/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
