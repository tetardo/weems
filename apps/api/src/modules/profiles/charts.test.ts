import { describe, expect, it } from "vitest";
import type { SummaryWithEvents } from "../flights/service.ts";
import { publicFlight, trackPoint } from "../../testing/public-flights.ts";
import { monthlyActivity, pilotCharts } from "./charts.ts";
import { dayAndNight, dayNightSeconds } from "./day-night.ts";
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

const point = (time: string, onGround = false) =>
  trackPoint({ at: new Date(`2026-11-11T${time}Z`).toISOString(), ...PARIS, onGround });

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
    const flight = (at: string, airborneS: number): SummaryWithEvents =>
      publicFlight({ at, blockS: airborneS + 600 });
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

describe("charts of a public profile", () => {
  const NOW = new Date("2026-11-20T00:00:00.000Z");

  it("counts durations and touchdowns per bucket, keeps the last landings oldest first", () => {
    const flights = [
      publicFlight({ blockS: 1800, vs: -40, at: "2026-11-03T09:00:00.000Z" }),
      publicFlight({ blockS: 3600, vs: -239, at: "2026-11-02T09:00:00.000Z" }),
      publicFlight({ blockS: 30_000, vs: -700, at: "2026-11-01T09:00:00.000Z" }),
      publicFlight({ blockS: null, vs: null }),
    ];
    const charts = pilotCharts(flights, new Map(), NOW);
    expect(charts.durations).toEqual([1, 1, 0, 0, 1]);
    expect(charts.touchdowns).toEqual([1, 1, 0, 1]);
    expect(charts.recentLandings.map((l) => l.touchdownVs)).toEqual([-700, -239, -40]);
  });

  it("places takeoffs in the local time of the place of takeoff", () => {
    // Monday 9 November 2026, 22:30 UTC: Tuesday 07:30 in Tokyo, Monday 17:30 in New York.
    const at = "2026-11-09T22:30:00.000Z";
    const tokyo = publicFlight({ at, takeoff: true });
    const newYork = publicFlight({ at, takeoff: true });
    const noTrack = publicFlight({ at, takeoff: true });
    const airStart = publicFlight({ at });
    const tracks = new Map([
      [tokyo.summary.flightId, [trackPoint({ lat: 35.55, lon: 139.78 })]],
      [newYork.summary.flightId, [trackPoint({ lat: 40.64, lon: -73.78 })]],
      [airStart.summary.flightId, [trackPoint()]],
    ]);
    const { takeoffs } = pilotCharts([tokyo, newYork, noTrack, airStart], tracks, NOW);
    expect(takeoffs[1]?.[7]).toBe(1);
    expect(takeoffs[0]?.[17]).toBe(1);
    expect(takeoffs.flat().reduce((a, b) => a + b, 0)).toBe(2);
  });
});
