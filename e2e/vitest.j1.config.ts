import { defineConfig } from "vitest/config";

/** J1 exit test: about 7 minutes, so outside `pnpm test` (run by `pnpm test:j1`). */
export default defineConfig({
  test: {
    name: "j1",
    root: import.meta.dirname,
    include: ["j1/**/*.j1.test.ts"],
    globalSetup: ["../apps/api/src/testing/global-setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 900_000,
  },
});
