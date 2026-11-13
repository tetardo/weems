import { describe, expect, it } from "vitest";
import { type Facts, stateOf } from "./service-state.ts";

const NOW = Date.parse("2026-11-11T20:00:00Z");
const up = { ok: true, detail: "/v1/health 200", ms: 8 };
const down = { ok: false, detail: "/v1/health sans réponse", ms: null };
const facts = (overrides: Partial<Facts>): Facts => ({
  probe: down,
  process: null,
  container: undefined,
  lastLine: null,
  nowMs: NOW,
  ...overrides,
});
const started = (secondsAgo: number) => ({
  running: true,
  pid: 42,
  startedAt: new Date(NOW - secondsAgo * 1000).toISOString(),
  exitCode: null,
});

describe("stateOf", () => {
  it("running: by the console, by Docker, or by someone else", () => {
    expect(stateOf(facts({ probe: up, process: started(10) })).runner).toBe("console");
    const container = { name: "api-db-1", running: true, status: "Up" };
    expect(stateOf(facts({ probe: up, container }))).toMatchObject({
      state: "running",
      runner: "docker",
    });
    expect(stateOf(facts({ probe: up }))).toMatchObject({ state: "running", runner: "outside" });
  });

  it("starting while pnpm dev compiles, then an error if it never answers", () => {
    expect(stateOf(facts({ process: started(30) })).state).toBe("starting");
    expect(stateOf(facts({ process: started(120) }))).toMatchObject({
      state: "error",
      error: "Ne répond pas : /v1/health sans réponse",
    });
  });

  it("stopped, or an error with the last line when the process failed", () => {
    expect(stateOf(facts({})).state).toBe("stopped");
    const failed = { running: false, pid: null, startedAt: null, exitCode: 1 };
    expect(stateOf(facts({ process: failed, lastLine: "EADDRINUSE :3000" }))).toMatchObject({
      state: "error",
      error: "EADDRINUSE :3000",
    });
    const stopped = { ...failed, exitCode: 143 };
    expect(stateOf(facts({ process: stopped })).state).toBe("stopped");
  });
});
