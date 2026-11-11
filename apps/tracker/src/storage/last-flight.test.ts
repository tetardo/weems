import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FlightEvent, OpenFlightRequest } from "@weems/contrats";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { lastClosedFlight } from "./last-flight.ts";
import { Recorder } from "./recorder.ts";

const open = (n: number, openedAt: string): OpenFlightRequest => ({
  flightId: `0197a000-0000-7000-8000-00000000000${n}`,
  callsign: "WMS1",
  aircraft: {
    simulator: "replay",
    title: `Aircraft ${n}`,
    model: null,
    registration: null,
    engineCount: 2,
    emptyWeightKg: null,
  },
  departureIcao: null,
  plannedArrivalIcao: null,
  openedAt,
  trackerVersion: "0.1.0",
});
const event = (seq: number, type: FlightEvent["type"], context = {}): FlightEvent => ({
  seq,
  at: "2026-11-11T09:00:00.000Z",
  type,
  context,
});

let dir: string;
let recorder: Recorder;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "weems-last-flight-"));
  recorder = new Recorder(join(dir, "tracker.db"));
});
afterEach(() => {
  recorder.close();
  rmSync(dir, { recursive: true, force: true });
});

describe("last closed flight", () => {
  it("is none before the first flight ends", () => {
    recorder.open(open(1, "2026-11-11T08:00:00.000Z"));
    expect(lastClosedFlight(recorder.db)).toBeNull();
  });

  it("gives the latest closed flight with its last touchdown, go-arounds and bounces", () => {
    const first = open(1, "2026-11-11T06:00:00.000Z");
    recorder.open(first);
    recorder.closeFlight(first.flightId, {
      closedAt: "2026-11-11T07:00:00.000Z",
      reason: "normal",
    });

    const second = open(2, "2026-11-11T08:00:00.000Z");
    recorder.open(second);
    recorder.event(second.flightId, event(1, "touchdown", { vs: -620 }));
    recorder.event(second.flightId, event(2, "goAround"));
    recorder.event(second.flightId, event(3, "touchdown", { vs: -145 }));
    recorder.event(second.flightId, event(4, "bounce"));
    recorder.closeFlight(second.flightId, {
      closedAt: "2026-11-11T10:00:00.000Z",
      reason: "normal",
    });

    expect(lastClosedFlight(recorder.db)).toEqual({
      flightId: second.flightId,
      aircraftTitle: "Aircraft 2",
      openedAt: "2026-11-11T08:00:00.000Z",
      closedAt: "2026-11-11T10:00:00.000Z",
      closeReason: "normal",
      touchdownFpm: -145,
      goArounds: 1,
      bounces: 1,
    });
  });
});
