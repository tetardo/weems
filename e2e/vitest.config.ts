import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "e2e",
    globalSetup: ["../apps/api/src/testing/global-setup.ts"],
  },
});
