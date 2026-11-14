import type { BandMinute, TrackView } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { minuteOfPoint, pointsOfMinutes } from "./minute-sync.ts";

const at = (m: number, s = 0) => new Date(Date.UTC(2026, 10, 14, 5, m, s)).toISOString();
const minutes = [0, 1, 2].map((m) => ({ at: at(m), phase: null, values: {} }) as BandMinute);
const point = (m: number, s: number) => ({ at: at(m, s) }) as TrackView["points"][number];

describe("minute sync", () => {
  it("pairs each minute with the point closest to its middle", () => {
    const points = [point(0, 5), point(0, 40), point(1, 50), point(2, 20)];
    expect(pointsOfMinutes(points, minutes)).toEqual([1, 2, 3]);
    expect(pointsOfMinutes([], minutes)).toEqual([-1, -1, -1]);
  });

  it("finds the minute of a point, kept inside the flight", () => {
    expect(minuteOfPoint(point(1, 59), minutes)).toBe(1);
    expect(minuteOfPoint(point(9, 0), minutes)).toBe(2);
    expect(minuteOfPoint(point(0, 0), [])).toBeNull();
  });
});
