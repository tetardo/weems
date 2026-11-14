import type { BandMinute, BandRow } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { bandCells } from "./band-scale.ts";

const minutes = (row: BandRow, values: (number | null)[]): BandMinute[] =>
  values.map((value, i) => ({
    at: new Date(Date.UTC(2026, 10, 12, 18, i)).toISOString(),
    phase: null,
    values: { [row]: value } as BandMinute["values"],
  }));
const levels = (row: BandRow, values: (number | null)[]) =>
  bandCells(minutes(row, values), row).map((c) => c?.level ?? null);

describe("cells of the flight bands", () => {
  it("spreads a value from the lowest to the highest of the flight", () => {
    expect(levels("altitude", [400, 10_000, 36_000, null])).toEqual([0, 2, 4, null]);
  });

  it("reads switches as the share of the minute", () => {
    expect(levels("autopilot", [0, 0.2, 1])).toEqual([0, 1, 4]);
  });

  it("reads flaps against the highest setting of the flight", () => {
    expect(levels("flaps", [0, 1, 4])).toEqual([0, 1, 4]);
  });

  it("colours the vertical speed by its direction", () => {
    const cells = bandCells(minutes("verticalSpeed", [2000, 0, -1000]), "verticalSpeed");
    expect(cells.map((c) => [c?.level, c?.tone])).toEqual([
      [4, "climb"],
      [0, "climb"],
      [2, "descent"],
    ]);
  });

  it("measures a zoomed stretch on the whole flight's scale", () => {
    const flight = minutes("altitude", [0, 10000, 34000, 34000]);
    const cruise = flight.slice(2);
    expect(bandCells(cruise, "altitude").map((c) => c?.level)).toEqual([0, 0]);
    expect(bandCells(cruise, "altitude", flight).map((c) => c?.level)).toEqual([4, 4]);
  });
});
