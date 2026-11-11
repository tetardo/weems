import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "e2e",
    exclude: ["j1/**", "j2/**", "**/node_modules/**"],
    globalSetup: ["../apps/api/src/testing/global-setup.ts"],
  },
});
