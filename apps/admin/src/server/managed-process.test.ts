import { describe, expect, it } from "vitest";
import { childEnv, ManagedProcess } from "./managed-process.ts";

describe("ManagedProcess", () => {
  it("keeps the output and the exit code", async () => {
    const lines: string[] = [];
    const process = new ManagedProcess((line) => lines.push(line));
    process.start("node", ["-e", "console.log('one'); console.error('two'); process.exit(3)"], ".");
    expect(process.status().running).toBe(true);
    await process.wait();
    expect(process.status()).toMatchObject({ running: false, exitCode: 3 });
    expect(lines.sort()).toEqual(["one", "two"]);
  });

  it("stops the whole group with SIGTERM", async () => {
    const process = new ManagedProcess();
    process.start("node", ["-e", "setInterval(() => {}, 1000)"], ".");
    await process.stop();
    expect(process.status().running).toBe(false);
  });
});

describe("childEnv", () => {
  it("drops what Next.js set for the console", () => {
    const env = {
      PATH: "/bin",
      PORT: "3002",
      NODE_ENV: "development",
      __NEXT_PRIVATE: "1",
      NEXT_RUNTIME: "nodejs",
    };
    expect(childEnv(env as NodeJS.ProcessEnv)).toEqual({ PATH: "/bin" });
  });
});
