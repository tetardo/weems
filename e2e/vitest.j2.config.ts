import { defineConfig } from "vitest/config";

/** J2 exit test of the site: needs the built site (run by `pnpm test:j2`). */
export default defineConfig({
  test: {
    name: "j2",
    root: import.meta.dirname,
    include: ["j2/**/*.j2.test.ts"],
    globalSetup: ["../apps/api/src/testing/global-setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
