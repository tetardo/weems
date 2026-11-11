import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "api",
    globalSetup: ["./src/testing/global-setup.ts"],
  },
});
