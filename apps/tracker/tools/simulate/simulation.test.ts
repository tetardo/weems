import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ApiClient } from "../../src/sender/api-client.ts";
import { fleetOf } from "../generate-flights/fleet.ts";
import { runSimulation } from "./simulation.ts";

const acceptAll: ApiClient = { post: async () => ({ status: 201 }) };
let workDir = "";

afterEach(() => rmSync(workDir, { recursive: true, force: true }));

describe("runSimulation with stopAfterMs (load test)", () => {
  it("stops the flights in the air and never starts the ones due later", async () => {
    workDir = mkdtempSync(join(tmpdir(), "weems-simulation-"));
    const startedAt = Date.now();
    const results = await runSimulation({
      scenarios: fleetOf(2),
      api: acceptAll,
      speed: 600,
      staggerS: 36_000, // second pilot due 60 real seconds later
      workDir,
      trackerVersion: "0.1.0",
      pumpEveryMs: 50,
      stopAfterMs: 2_000, // 20 simulated minutes: the first flight is open
    });
    expect(Date.now() - startedAt).toBeLessThan(10_000);
    expect(results[0]?.flightId).not.toBeNull();
    expect(results[1]?.flightId).toBeNull();
    expect(results.map((r) => r.pending)).toEqual([0, 0]);
  });
});
