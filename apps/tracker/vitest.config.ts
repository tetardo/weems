import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "tracker",
    // Whole flights replayed in a few seconds commit to SQLite hundreds of times. Each commit waits
    // for the disk (kept on purpose: at most 1 s lost if the PC crashes), about 20 ms on the Windows
    // CI disk: those tests take up to 20 s there, under 1 s on Linux.
    testTimeout: 60_000,
  },
});
