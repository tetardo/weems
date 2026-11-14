import type { FlightBands } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { alarmsOf } from "./ecam-alarms.ts";

const bands = (marks: FlightBands["marks"]) => ({ marks }) as FlightBands;

describe("alarmsOf", () => {
  it("gives one alarm per stretch, in flight order, the two cabin rows counted once", () => {
    expect(
      alarmsOf(
        bands([
          { row: "speed", from: 7, to: 9, reason: "speed250" },
          { row: "cabinAltitude", from: 3, to: 4, reason: "cabinRate" },
          { row: "cabinRate", from: 3, to: 4, reason: "cabinRate" },
        ]),
      ),
    ).toEqual([
      { minute: 3, reason: "cabinRate" },
      { minute: 7, reason: "speed250" },
    ]);
  });

  it("has nothing to say without marks (plan without them)", () => {
    expect(alarmsOf(bands(null))).toEqual([]);
  });
});
