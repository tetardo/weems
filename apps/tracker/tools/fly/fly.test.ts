import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FakeSimLink } from "../../src/connectors/msfs/fake-sim-link.ts";
import { rawFromAircraft, rawFromSample } from "../../src/connectors/msfs/raw-sample-fixture.ts";
import { parseReplay } from "../../src/connectors/replay/replay-format.ts";
import type { ApiClient } from "../../src/sender/api-client.ts";
import { generateFlight } from "../generate-flights/generator.ts";
import { LFPG_LFBO } from "../generate-flights/scenario.ts";
import { startFly } from "./fly.ts";

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), "weems-fly-"))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const tick = () => new Promise((resolve) => setImmediate(resolve));

describe("pnpm fly, without the simulator", () => {
  it("records a flight read through SimConnect values and sends it to the API", async () => {
    const paths: string[] = [];
    const api: ApiClient = {
      post: async (path) => {
        paths.push(path.replace(/[0-9a-f-]{36}/, "<id>"));
        return { status: 201 };
      },
    };
    const link = new FakeSimLink();
    link.simulatorRunning = true;
    let now = 0;
    let replay = "";
    const reports: string[] = [];
    const fly = startFly({
      link,
      api,
      databasePath: join(dir, "tracker.db"),
      callsign: "WMS1",
      flightPlan: { departureIcao: "LFPG", arrivalIcao: "LFBO" },
      trackerVersion: "0.1.0",
      record: (line) => (replay += line),
      report: (message) => reports.push(message),
      now: () => now,
      utcNow: () => Date.UTC(2026, 10, 11, 8, 0, 0) + now,
      pumpEveryMs: 60_000,
    });
    await tick();

    // The simulator sends the synthetic flight as raw SimConnect values.
    const flight = generateFlight(LFPG_LFBO);
    for (const record of flight.records) {
      now = record.t;
      if (record.type === "aircraft") link.sim.aircraft(rawFromAircraft(record.data));
      if (record.type === "sample") link.sim.sample(rawFromSample(record.data));
    }
    const pending = await fly.stop();

    expect(pending).toBe(0);
    expect(paths.filter((p) => !p.endsWith("/positions"))).toEqual([
      "/v1/flights",
      "/v1/flights/<id>/events",
      "/v1/flights/<id>/close",
      "/v1/flights/<id>/track",
    ]);
    expect(reports).toEqual(
      expect.arrayContaining([
        "Simulateur connecté.",
        expect.stringMatching(/^Vol .+, phase ARRIVED, 0 message\(s\) en attente$/),
      ]),
    );
    const recorded = parseReplay(replay);
    expect(recorded.records.filter((r) => r.type === "sample")).toHaveLength(
      flight.records.filter((r) => r.type === "sample").length,
    );
  });
});
