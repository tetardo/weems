import type { FlightEvent, TrackPoint } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { publicFlight } from "../../testing/public-flights.ts";
import { logbookStats, type StatsOptions } from "./stats.ts";
import { phaseTimeOf } from "./stats-technique.ts";

const NOW = new Date("2026-11-12T20:00:00.000Z");
const FREE: StatsOptions = {
  period: "12m",
  allowedPeriods: ["30d", "12m"],
  pro: { categoryTrends: false, phaseTime: false, goodPractices: false },
  airportName: (icao) => (icao === "LFPG" ? "Paris-CDG" : null),
};
const PRO: StatsOptions = {
  ...FREE,
  pro: { categoryTrends: true, phaseTime: true, goodPractices: true },
};
const NO_TRACKS = new Map<string, TrackPoint[]>();

describe("logbookStats (page Statistiques)", () => {
  it("is empty for a pilot without flights, Pro blocks null on Pilot Free", () => {
    const stats = logbookStats([], NO_TRACKS, FREE, NOW);
    expect(stats.activity).toMatchObject({ flights: 0, airborneS: 0, averageBlockS: null });
    expect(stats.months).toHaveLength(12);
    expect(stats.weekdays).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(stats.takeoffHours).toHaveLength(24);
    expect(stats.categoryTrends).toBeNull();
    expect(stats.phaseTime).toBeNull();
    expect(stats.goodPractices).toBeNull();
  });

  it("keeps the flights of the period only", () => {
    const flights = [
      publicFlight({ at: "2026-11-10T10:00:00.000Z" }),
      publicFlight({ at: "2026-08-10T10:00:00.000Z" }),
    ];
    const month = logbookStats(flights, NO_TRACKS, { ...FREE, period: "30d" }, NOW);
    const year = logbookStats(flights, NO_TRACKS, FREE, NOW);
    expect(month.activity.flights).toBe(1);
    expect(year.activity.flights).toBe(2);
  });

  it("counts routes both ways together and names the airports", () => {
    const flights = [
      publicFlight({ dep: "LFPG", arr: "LFMN", vs: -100 }),
      publicFlight({ dep: "LFMN", arr: "LFPG", vs: -200 }),
      publicFlight({ dep: "LFBD", arr: "LFBO" }),
    ];
    const stats = logbookStats(flights, NO_TRACKS, FREE, NOW);
    expect(stats.routes[0]).toEqual({
      airports: ["LFMN", "LFPG"],
      flights: 2,
      blockS: 7200,
      touchdownAverage: -150,
    });
    expect(stats.airports[0]).toEqual({ icao: "LFPG", name: "Paris-CDG", visits: 2 });
  });

  it("gives the trend of the touchdowns by category on Pilot Pro (> 0: softer)", () => {
    const flights = Array.from({ length: 6 }, (_, i) =>
      publicFlight({ category: "narrowBody", vs: i < 3 ? -100 : -200 }),
    );
    const [trend] = logbookStats(flights, NO_TRACKS, PRO, NOW).categoryTrends ?? [];
    expect(trend).toMatchObject({ category: "narrowBody", flights: 6, trendFpm: 100 });
  });

  it("checks the good practices along the trajectories", () => {
    const fast = publicFlight();
    const slow = publicFlight();
    const point = (ias: number, at: string): TrackPoint =>
      ({
        at,
        lat: 45,
        lon: 2,
        altMsl: 3000,
        altAgl: 2500,
        ias,
        gs: ias,
        vs: 0,
        heading: 0,
        onGround: false,
      }) as TrackPoint;
    const tracks = new Map([
      [
        fast.summary.flightId,
        [point(280, "2026-11-11T09:00:00Z"), point(280, "2026-11-11T09:01:00Z")],
      ],
      [
        slow.summary.flightId,
        [point(200, "2026-11-11T09:00:00Z"), point(200, "2026-11-11T09:01:00Z")],
      ],
    ]);
    const practices = logbookStats([fast, slow], tracks, PRO, NOW).goodPractices ?? [];
    expect(practices.find((p) => p.practice === "speed250")).toEqual({
      practice: "speed250",
      flights: 2,
      share: 0.5,
    });
    expect(practices.find((p) => p.practice === "bank30")?.share).toBeNull();
  });
});

describe("phaseTimeOf", () => {
  it("averages the time from one change of phase to the next", () => {
    const change = (to: string, at: string, seq: number): FlightEvent =>
      ({ seq, at, type: "phaseChanged", context: { to } }) as FlightEvent;
    const flight = publicFlight();
    flight.events = [
      change("TAKEOFF", "2026-11-11T09:00:00Z", 1),
      change("CLIMB", "2026-11-11T09:01:00Z", 2),
      change("CRUISE", "2026-11-11T09:21:00Z", 3),
    ];
    expect(phaseTimeOf([flight]).phases).toEqual([
      { phase: "TAKEOFF", seconds: 60 },
      { phase: "CLIMB", seconds: 1200 },
    ]);
  });
});
