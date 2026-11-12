import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp } from "../../apps/api/src/testing/test-app.ts";
import { runLoad } from "./load-run.ts";
import { judge } from "./report.ts";

let api: Awaited<ReturnType<typeof startTestApp>>;
let baseUrl: string;
let workDir: string;

beforeAll(async () => {
  api = await startTestApp();
  await api.app.listen({ port: 0, host: "127.0.0.1" });
  baseUrl = `http://127.0.0.1:${(api.app.server.address() as AddressInfo).port}`;
  workDir = mkdtempSync(join(tmpdir(), "weems-load-test-"));
});
afterAll(async () => {
  await api.stop();
  rmSync(workDir, { recursive: true, force: true });
});

describe("pnpm load (spec J4, montée en charge du direct)", () => {
  it("measures a small run end to end and passes every measurable criterion", async () => {
    const measures = await runLoad({
      baseUrl,
      token: "dev-token",
      pilots: 4,
      viewers: 3,
      speed: 120,
      minutes: 0.5,
      workDir,
      clearFlights: false,
    });
    const criteria = judge(measures);
    expect(criteria.filter((c) => c.passed === false)).toEqual([]);
    // Memory drift is judged from 20 min on: a 30 s run is still warming up.
    expect(criteria.filter((c) => c.passed === null).map((c) => c.id)).toEqual([6]);
    expect(measures.positionsSent).toBeGreaterThan(20);
    expect(measures.deliveryDelayMs.count).toBeGreaterThan(measures.positionsSent);
  }, 120_000);
});
