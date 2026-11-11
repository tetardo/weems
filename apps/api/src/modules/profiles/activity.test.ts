import type { TrackPoint } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import type { SummaryWithEvents } from "../flights/service.ts";
import { dayAndNight, monthlyActivity } from "./activity.ts";
import { dayNightSeconds } from "./day-night.ts";
import { sunElevationDeg } from "./sun.ts";

const PARIS = { lat: 48.86, lon: 2.35 };

describe("sun elevation", () => {
  it("is overhead the tropic at the June solstice noon", () => {
    expect(sunElevationDeg(new Date("2026-06-21T12:00:00Z"), 23.44, 0)).toBeGreaterThan(89);
  });

  it("follows the civil twilight in Paris on 11 November 2026 (sunset about 16:15 UTC)", () => {
    const at = (time: string) =>
      sunElevationDeg(new Date(`2026-11-11T${time}Z`), PARIS.lat, PARIS.lon);
    expect(at("12:00")).toBeGreaterThan(20);
    expect(at("16:30")).toBeLessThan(0);
    expect(at("16:30")).toBeGreaterThan(-6);
    expect(at("17:15")).toBeLessThan(-6);
  });
});

function point(time: string, onGround = false): TrackPoint {
  const at = new Date(`2026-11-11T${time}Z`).toISOString();
  return {
    at,
    ...PARIS,
    altMsl: 5000,
    altAgl: 5000,
    ias: 200,
    gs: 200,
    vs: 0,
    heading: 0,
    onGround,
  };
}

describe("day and night hours", () => {
  it("splits airborne time at the end of civil twilight, ground time left out", () => {
    const points = [
      point("15:30", true),
      point("16:00"),
      point("17:00"),
      point("18:00"),
      point("18:30", true),
    ];
    expect(dayNightSeconds(points)).toEqual({ dayS: 3600, nightS: 3600 });
    expect(dayAndNight([points, points])).toEqual({ dayS: 7200, nightS: 7200 });
  });
});

describe("activity by month", () => {
  it("gives the last 12 months, oldest first, with empty months", () => {
    const flight = (openedAt: string, airborneS: number) =>
      ({ summary: { openedAt, times: { airborneS } }, events: [] }) as unknown as SummaryWithEvents;
    const months = monthlyActivity(
      [
        flight("2026-11-02T10:00:00.000Z", 3600),
        flight("2026-11-30T23:00:00.000Z", 1800),
        flight("2025-11-30T10:00:00.000Z", 999),
      ],
      new Date("2026-11-20T00:00:00.000Z"),
    );
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ month: "2025-12", airborneS: 0 });
    expect(months[11]).toEqual({ month: "2026-11", airborneS: 5400 });
  });
});
