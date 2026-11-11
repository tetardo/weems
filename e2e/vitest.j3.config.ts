import { defineConfig } from "vitest/config";

/** J3 browser tests of the logins: need the built site (run by `pnpm test:j3`). */
export default defineConfig({
  test: {
    name: "j3",
    root: import.meta.dirname,
    include: ["j3/**/*.j3.test.ts"],
    globalSetup: ["../apps/api/src/testing/global-setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
