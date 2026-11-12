import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type FlightEvent, uuidV7 } from "@weems/contrats";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FakeSimLink } from "../connectors/msfs/fake-sim-link.ts";
import { rawFromAircraft, rawFromSample } from "../connectors/msfs/raw-sample-fixture.ts";
import { ReplayConnector } from "../connectors/replay/replay-connector.ts";
import { parseReplay } from "../connectors/replay/replay-format.ts";
import { AIRLINER_PARAMS } from "../core/phases/params.ts";
import { createTracker } from "../runtime/create-tracker.ts";
import type { ApiClient } from "../sender/api-client.ts";
import { generateFlight } from "../../tools/generate-flights/generator.ts";
import { LFPG_LFBO } from "../../tools/generate-flights/scenario.ts";
import { startMsfsTracker } from "./msfs-tracker.ts";

let dir: string;
beforeEach(() => (dir = mkdtempSync(join(tmpdir(), "weems-fly-"))));
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const tick = () => new Promise((resolve) => setImmediate(resolve));

describe("pnpm fly, without the simulator", () => {
  it("records a flight read through SimConnect values and sends it to the API", async () => {
    const paths: string[] = [];
    const live: { path: string; body: unknown }[] = [];
    const api: ApiClient = {
      post: async (path, body) => {
        paths.push(path.replace(/[0-9a-f-]{36}/, "<id>"));
        live.push({ path, body });
        return { status: 201 };
      },
    };
    const link = new FakeSimLink();
    link.simulatorRunning = true;
    let now = 0;
    let replay = "";
    const reports: string[] = [];
    const fly = startMsfsTracker({
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
    const flight = generateFlight({ ...LFPG_LFBO, disturbances: ["goAround", "bounce"] });
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

    // J2 criterion 2: replaying the recording gives the same phases and events as live.
    const replayed: { path: string; body: unknown }[] = [];
    const again = createTracker({
      connector: new ReplayConnector(recorded),
      databasePath: join(dir, "replay.db"),
      api: { post: async (path, body) => (replayed.push({ path, body }), { status: 201 }) },
      session: {
        callsign: "WMS1",
        flightPlan: { departureIcao: "LFPG", arrivalIcao: "LFBO" },
        trackerVersion: "0.1.0",
        clock: { nowUtcMs: () => Date.UTC(2026, 10, 11, 8, 0, 0) },
        newFlightId: uuidV7,
        params: AIRLINER_PARAMS,
      },
    });
    await again.runtime.start();
    await again.runtime.pump(Date.now());
    again.recorder.close();
    expect(eventSequence(replayed)).toEqual(eventSequence(live));
    expect(eventSequence(live)).toEqual(
      expect.arrayContaining(["goAround", "bounce", "phaseChanged:ARRIVED"]),
    );
  });
});

/** Event types in order, phase changes with their phase (times differ between runs). */
function eventSequence(calls: { path: string; body: unknown }[]): string[] {
  return calls
    .flatMap((c) => (c.body as { events?: FlightEvent[] }).events ?? [])
    .map((e) => (e.type === "phaseChanged" ? `phaseChanged:${String(e.context["to"])}` : e.type));
}
