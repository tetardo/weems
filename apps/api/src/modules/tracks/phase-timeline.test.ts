import type { FlightEvent } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { phaseChangeIndices, phasesAt, phaseStarts } from "./phase-timeline.ts";

const change = (seq: number, at: string, to: string): FlightEvent => ({
  seq,
  at: `2026-11-11T08:${at}.000Z`,
  type: "phaseChanged",
  context: { to },
});
const events: FlightEvent[] = [
  change(1, "01:00", "TAXI_OUT"),
  { seq: 2, at: "2026-11-11T08:02:00.000Z", type: "paused", context: {} },
  change(3, "05:00", "TAKEOFF"),
];
const times = ["00:30", "01:00", "03:00", "06:00"].map((t) =>
  Date.parse(`2026-11-11T08:${t}.000Z`),
);

describe("phase timeline", () => {
  it("gives each time the phase in force, null before the first", () => {
    expect(phasesAt(phaseStarts(events), times)).toEqual([null, "TAXI_OUT", "TAXI_OUT", "TAKEOFF"]);
  });

  it("finds the first point of each phase", () => {
    expect(phaseChangeIndices(phaseStarts(events), times)).toEqual([1, 3]);
  });
});
