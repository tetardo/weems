import type { BandMinute, FlightPhase } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import {
  isFlat,
  milestones,
  minuteOfParam,
  minuteParam,
  rangeText,
  rowRange,
} from "./row-facts.ts";

const minute = (i: number, phase: FlightPhase, values: Partial<BandMinute["values"]> = {}) =>
  ({
    at: new Date(Date.UTC(2026, 10, 14, 6, i)).toISOString(),
    phase,
    values,
  }) as BandMinute;

describe("row facts", () => {
  it("writes the range of a row as a display does", () => {
    const minutes = [800, 35000, null].map((a, i) => minute(i, "CRUISE", { altitude: a }));
    const range = rowRange(minutes, "altitude");
    expect(range).toEqual({ low: 800, high: 35000 });
    expect(rangeText("altitude", range)).toBe("800–35 000 FT");
    expect(isFlat(range)).toBe(false);
  });

  it("finds flat rows and rows without any value", () => {
    const minutes = [0, 0].map((s, i) => minute(i, "CRUISE", { spoilers: s }));
    expect(isFlat(rowRange(minutes, "spoilers"))).toBe(true);
    expect(rangeText("spoilers", rowRange(minutes, "spoilers"))).toBe("RET");
    expect(rowRange(minutes, "n1")).toBeNull();
    expect(rangeText("n1", null)).toBe("");
  });

  it("marks takeoff, top of climb, top of descent and touchdown in order", () => {
    const phases: FlightPhase[] = [
      "TAXI_OUT",
      "TAKEOFF",
      "CLIMB",
      "CRUISE",
      "CRUISE",
      "DESCENT",
      "APPROACH",
      "LANDING",
      "TAXI_IN",
    ];
    expect(milestones(phases.map((p, i) => minute(i, p)))).toEqual([
      { key: "takeoff", minute: 1 },
      { key: "topOfClimb", minute: 3 },
      { key: "topOfDescent", minute: 5 },
      { key: "touchdown", minute: 7 },
    ]);
  });

  it("skips what did not happen (no cruise on a circuit)", () => {
    const phases: FlightPhase[] = ["CLIMB", "DESCENT", "TAXI_IN"];
    expect(milestones(phases.map((p, i) => minute(i, p))).map((m) => m.key)).toEqual([
      "takeoff",
      "topOfDescent",
      "touchdown",
    ]);
  });

  it("reads and writes the minute of the address", () => {
    const minutes = [0, 1, 2].map((i) => minute(i, "CRUISE"));
    expect(minuteParam(minutes[2] ?? minute(0, "CRUISE"))).toBe("06:02");
    expect(minuteOfParam(minutes, "06:01")).toBe(1);
    expect(minuteOfParam(minutes, "07:00")).toBeNull();
    expect(minuteOfParam(minutes, "<script>")).toBeNull();
    expect(minuteOfParam(minutes, null)).toBeNull();
  });
});
