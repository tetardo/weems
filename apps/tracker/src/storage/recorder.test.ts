import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { OpenFlightRequest } from "@weems/contrats";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sample } from "../core/testing/sample.ts";
import { Recorder } from "./recorder.ts";

const open: OpenFlightRequest = {
  flightId: "0197a000-0000-7000-8000-000000000001",
  callsign: "WMS1",
  aircraft: {
    simulator: "replay",
    title: "Airbus A320neo",
    model: null,
    registration: null,
    engineCount: 2,
    emptyWeightKg: null,
  },
  departureIcao: null,
  plannedArrivalIcao: null,
  openedAt: "2026-11-11T08:00:00.000Z",
  trackerVersion: "0.1.0",
};
const id = open.flightId;

let dir: string;
let path: string;
let recorder: Recorder;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "weems-recorder-"));
  path = join(dir, "tracker.db");
  recorder = new Recorder(path);
});
afterEach(() => {
  if (recorder.db.open) recorder.close();
  rmSync(dir, { recursive: true, force: true });
});

const outbox = (r: Recorder) =>
  r.db
    .prepare("SELECT kind FROM outbox ORDER BY id")
    .all()
    .map((row) => (row as { kind: string }).kind);

describe("recorder", () => {
  it("schedules every message for sending in the same write as its data", () => {
    recorder.open(open);
    recorder.event(id, {
      seq: 1,
      at: open.openedAt,
      type: "phaseChanged",
      context: { to: "BOARDING" },
    });
    recorder.closeFlight(id, { closedAt: "2026-11-11T09:00:00.000Z", reason: "normal" });
    expect(outbox(recorder)).toEqual(["open", "events", "close"]);
  });

  it("writes samples only on flush, in one go", () => {
    recorder.open(open);
    recorder.sample(id, sample({ t: 1000 }));
    recorder.sample(id, sample({ t: 2000 }));
    const count = () =>
      (recorder.db.prepare("SELECT count(*) AS n FROM samples").get() as { n: number }).n;
    expect(count()).toBe(0);
    recorder.flush();
    expect(count()).toBe(2);
  });

  it("finds the open flight again after a crash, with its last state", () => {
    recorder.open(open);
    recorder.event(id, {
      seq: 3,
      at: "2026-11-11T08:30:00.000Z",
      type: "phaseChanged",
      context: { to: "CRUISE" },
    });
    recorder.position(id, {
      seq: 9,
      at: "2026-11-11T08:31:00.000Z",
      lat: 46,
      lon: 2,
      altMsl: 35000,
      gs: 450,
      heading: 190,
      vs: 0,
      phase: "CRUISE",
      onGround: false,
    });
    // No close(): the process dies. A new recorder opens the same file.
    const afterCrash = new Recorder(path);
    expect(afterCrash.unfinishedFlights()).toEqual([
      {
        flightId: id,
        aircraftTitle: "Airbus A320neo",
        lastSeq: 3,
        lastPositionSeq: 9,
        lastPhase: "CRUISE",
        lastLat: 46,
        lastLon: 2,
        lastAt: "2026-11-11T08:31:00.000Z",
      },
    ]);
    afterCrash.close();
  });

  it("never records the same event twice", () => {
    recorder.open(open);
    const event = { seq: 1, at: open.openedAt, type: "paused" as const, context: {} };
    recorder.event(id, event);
    expect(() => recorder.event(id, event)).toThrow();
    expect(outbox(recorder)).toEqual(["open", "events"]);
  });
});
