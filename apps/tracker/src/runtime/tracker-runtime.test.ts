import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { generateFlight } from "../../tools/generate-flights/generator.ts";
import { LFPG_LFBO } from "../../tools/generate-flights/scenario.ts";
import { ReplayConnector } from "../connectors/replay/replay-connector.ts";
import type { Replay } from "../connectors/replay/replay-format.ts";
import { AIRLINER_PARAMS } from "../core/phases/params.ts";
import type { ApiClient } from "../sender/api-client.ts";
import { createTracker } from "./create-tracker.ts";

const START_UTC = Date.UTC(2026, 10, 11, 8, 0, 0);
const flight = generateFlight(LFPG_LFBO);
let ids = 0;

let dir: string;
let calls: { path: string; body: unknown }[];
const api: ApiClient = {
  post: async (path, body) => {
    calls.push({ path, body });
    return { status: 201 };
  },
};

const sessionAt = (utcMs: number) => ({
  callsign: "WMS1",
  trackerVersion: "0.1.0",
  clock: { nowUtcMs: () => utcMs },
  newFlightId: () => `0197a000-0000-7000-8000-00000000000${++ids}`,
  params: AIRLINER_PARAMS,
});

/** One tracker run on the same local database file, with the clock at `utcMs`. */
function runtime(replay: Replay, utcMs: number, connector = new ReplayConnector(replay)) {
  return createTracker({
    connector,
    databasePath: join(dir, "tracker.db"),
    api,
    random: () => 0,
    session: sessionAt(utcMs),
  });
}

/** Splits the generated flight at sample time `t`; the second part starts with the aircraft. */
function split(t: number): [Replay, Replay] {
  const [aircraft] = flight.records;
  const before = flight.records.filter((r) => r.t < t);
  const after = flight.records.filter((r) => r.t >= t && r.type !== "aircraft");
  return [
    { header: flight.header, records: before },
    { header: flight.header, records: aircraft ? [aircraft, ...after] : after },
  ];
}

const sentEvents = () =>
  calls.flatMap((c) => (c.body as { events?: { seq: number; type: string }[] }).events ?? []);
/** Queued messages only (the live position is sent on the side). */
const queued = () => calls.filter((c) => !c.path.endsWith("/positions"));
const sentPaths = () => queued().map((c) => c.path.replace(/0197a000-[0-9a-f-]+/, "<id>"));

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "weems-runtime-"));
  calls = [];
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe("tracker runtime", () => {
  it("records and sends a whole flight", async () => {
    const { runtime: tracker, recorder } = runtime(flight, START_UTC);
    await tracker.start();
    await tracker.pump(START_UTC);
    recorder.close();
    expect(sentPaths()).toEqual([
      "/v1/flights",
      "/v1/flights/<id>/events",
      "/v1/flights/<id>/close",
      "/v1/flights/<id>/track",
    ]);
    expect(sentEvents().map((e) => e.seq)).toEqual(sentEvents().map((_e, i) => i + 1));
  });

  it("reads every frame around takeoff and landing, once per second elsewhere (EF-09)", async () => {
    const rates: string[] = [];
    class RateSpy extends ReplayConnector {
      override setReadRate(rate: "high" | "normal"): void {
        if (rates.at(-1) !== rate) rates.push(rate);
      }
    }
    const { runtime: tracker, recorder } = runtime(flight, START_UTC, new RateSpy(flight));
    await tracker.start();
    recorder.close();
    expect(rates).toEqual(["normal", "high", "normal", "high", "normal"]);
  });

  it("resumes the same flight after a crash (ENF-02), numbering without gap", async () => {
    const cut = 3_000_000; // in cruise
    const [first, second] = split(cut);
    const crashed = runtime(first, START_UTC);
    await crashed.runtime.start();
    await crashed.runtime.pump(START_UTC);
    const flightId = crashed.runtime.currentFlightId;
    // The process dies here: nothing is closed.

    const restarted = runtime(second, START_UTC + cut + 5 * 60_000);
    await restarted.runtime.start();
    await restarted.runtime.pump(START_UTC + cut);
    restarted.recorder.close();

    expect(restarted.runtime.currentFlightId).toBe(flightId);
    const events = sentEvents();
    expect(events.map((e) => e.seq)).toEqual(events.map((_e, i) => i + 1));
    expect(events.map((e) => e.type)).toContain("resumed");
    const [close, track] = queued().slice(-2);
    expect(close?.body).toMatchObject({ reason: "normal" });
    // The trajectory covers both parts of the flight, in time order.
    const times = (track?.body as { points: { at: string }[] }).points.map((p) => Date.parse(p.at));
    expect(times[0]).toBe(START_UTC);
    expect(times.every((t, i) => i === 0 || t > (times[i - 1] ?? 0))).toBe(true);
    expect(times.some((t) => t > START_UTC + cut)).toBe(true);
  });

  it("closes the old flight as interrupted when the restart is too late", async () => {
    const cut = 3_000_000;
    const [first, second] = split(cut);
    const crashed = runtime(first, START_UTC);
    await crashed.runtime.start();
    const oldId = crashed.runtime.currentFlightId;

    const restarted = runtime(second, START_UTC + cut + 2 * 3_600_000);
    await restarted.runtime.start();
    await restarted.runtime.pump(START_UTC);
    restarted.recorder.close();

    const closes = calls.filter((c) => c.path.endsWith("/close"));
    expect(closes[0]).toEqual({
      path: `/v1/flights/${oldId}/close`,
      body: expect.objectContaining({ reason: "interrupted" }),
    });
    expect(restarted.runtime.currentFlightId).not.toBe(oldId);
  });
});
