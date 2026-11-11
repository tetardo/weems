import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ApiClient } from "../../src/sender/api-client.ts";
import { fleetOf } from "../generate-flights/fleet.ts";
import { runSimulation, type SimulationProgress } from "./simulation.ts";

const acceptAll: ApiClient = { post: async () => ({ status: 201 }) };
const options = (overrides: Partial<Parameters<typeof runSimulation>[0]>) => ({
  scenarios: fleetOf(2),
  api: acceptAll,
  speed: 600,
  staggerS: 36_000, // second pilot due 60 real seconds later
  workDir,
  trackerVersion: "0.1.0",
  pumpEveryMs: 50,
  ...overrides,
});
let workDir = "";

afterEach(() => rmSync(workDir, { recursive: true, force: true }));

describe("runSimulation with stopAfterMs (load test)", () => {
  it("stops the flights in the air and never starts the ones due later", async () => {
    workDir = mkdtempSync(join(tmpdir(), "weems-simulation-"));
    const startedAt = Date.now();
    const results = await runSimulation(
      options({ stopAfterMs: 2_000 }), // 20 simulated minutes: the first flight is open
    );
    expect(Date.now() - startedAt).toBeLessThan(10_000);
    expect(results[0]?.flightId).not.toBeNull();
    expect(results[1]?.flightId).toBeNull();
    expect(results.map((r) => r.pending)).toEqual([0, 0]);
  });
});

describe("runSimulation stopped by a signal (admin console)", () => {
  it("closes the flight in the air as interrupted and reports progress", async () => {
    workDir = mkdtempSync(join(tmpdir(), "weems-simulation-"));
    const closes: unknown[] = [];
    const api: ApiClient = {
      post: async (path, body) => {
        if (path.endsWith("/close")) closes.push(body);
        return { status: 201 };
      },
    };
    const progress: SimulationProgress[] = [];
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 2_000);
    const startedAt = Date.now();
    const results = await runSimulation(
      options({ api, signal: controller.signal, onProgress: (p) => progress.push(p) }),
    );
    expect(Date.now() - startedAt).toBeLessThan(10_000);
    expect(results[1]?.flightId).toBeNull();
    expect(closes).toEqual([expect.objectContaining({ reason: "interrupted" })]);
    expect(progress.at(-1)).toMatchObject({ total: 2, departed: 1, pending: 0 });
  });
});
