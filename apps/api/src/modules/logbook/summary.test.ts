import { describe, expect, it } from "vitest";
import { publicFlight } from "../../testing/public-flights.ts";
import { logbookSummary } from "./summary.ts";

const NOW = new Date("2026-11-12T20:00:00.000Z");
const at = (iso: string) => ({ at: iso });

describe("logbookSummary (page Résumé)", () => {
  it("is empty for a pilot without flights", () => {
    const summary = logbookSummary([], null, NOW);
    expect(summary.lastFlight).toBeNull();
    expect(summary.monthAirborneS).toEqual({ current: 0, previous: 0 });
    expect(summary.touchdownAverage).toEqual({ current: null, previous: null });
    expect(summary.cleanLandingShare).toEqual({ current: null, previous: null });
    expect(summary.streakDays).toEqual({ current: 0, record: 0 });
    expect(summary.recentFlights).toEqual([]);
  });

  it("describes the newest flight with its landing and distance", () => {
    const last = publicFlight({
      ...at("2026-11-12T18:00:00.000Z"),
      vs: -142,
      extra: ["goAround", "bounce"],
    });
    const older = publicFlight(at("2026-11-11T18:00:00.000Z"));
    const summary = logbookSummary([last, older], { distanceNm: 372, fuelUsedKg: 2900 }, NOW);
    expect(summary.lastFlight).toMatchObject({
      flight: { flightId: last.summary.flightId },
      touchdownVs: -142,
      bounces: 1,
      goArounds: 1,
      distanceNm: 372,
      fuelUsedKg: 2900,
    });
  });

  it("sums the airborne time of this month and the month before (UTC)", () => {
    const flights = [
      publicFlight({ ...at("2026-11-02T10:00:00.000Z"), blockS: 4200 }),
      publicFlight({ ...at("2026-10-31T23:00:00.000Z"), blockS: 1800 }),
      publicFlight({ ...at("2026-09-30T10:00:00.000Z"), blockS: 9000 }),
    ];
    expect(logbookSummary(flights, null, NOW).monthAirborneS).toEqual({
      current: 3600,
      previous: 1200,
    });
  });

  it("compares the mean touchdown of the last 10 landings with the 10 before", () => {
    const flights = Array.from({ length: 20 }, (_, i) =>
      publicFlight({
        ...at(`2026-11-${String(12 - Math.floor(i / 2)).padStart(2, "0")}T10:00:00.000Z`),
        vs: i < 10 ? -100 : -200,
      }),
    );
    expect(logbookSummary(flights, null, NOW).touchdownAverage).toEqual({
      current: -100,
      previous: -200,
    });
  });

  it("gives the share of clean landings over 30 days and the 30 days before", () => {
    const flights = [
      publicFlight(at("2026-11-10T10:00:00.000Z")),
      publicFlight({ ...at("2026-11-09T10:00:00.000Z"), extra: ["bounce"] }),
      publicFlight({ ...at("2026-10-01T10:00:00.000Z"), extra: ["goAround"] }),
      publicFlight({ ...at("2026-11-08T10:00:00.000Z"), landed: false }),
    ];
    expect(logbookSummary(flights, null, NOW).cleanLandingShare).toEqual({
      current: 0.5,
      previous: 0,
    });
  });

  it("counts days in a row with a flight, and the record", () => {
    const days = [
      "2026-11-12",
      "2026-11-11",
      "2026-11-10",
      "2026-11-01",
      "2026-10-31",
      "2026-10-30",
      "2026-10-29",
    ];
    const flights = days.map((d) => publicFlight(at(`${d}T10:00:00.000Z`)));
    expect(logbookSummary(flights, null, NOW).streakDays).toEqual({ current: 3, record: 4 });
  });

  it("groups the flying days of the last 17 weeks, oldest first", () => {
    const flights = [
      publicFlight({ ...at("2026-11-12T08:00:00.000Z"), blockS: 1200 }),
      publicFlight({ ...at("2026-11-12T18:00:00.000Z"), blockS: 1200 }),
      publicFlight(at("2026-11-01T10:00:00.000Z")),
      publicFlight(at("2026-05-01T10:00:00.000Z")),
    ];
    expect(logbookSummary(flights, null, NOW).flyingDays).toEqual([
      { day: "2026-11-01", flights: 1, airborneS: 3000 },
      { day: "2026-11-12", flights: 2, airborneS: 1200 },
    ]);
  });

  it("lists what to work on over the last 10 flights that landed", () => {
    const bounced = publicFlight({
      ...at("2026-11-12T10:00:00.000Z"),
      extra: ["goAround", "bounce"],
    });
    const alerted = publicFlight(at("2026-11-11T10:00:00.000Z"));
    alerted.summary.alerts = ["paused", "simRateChanged"];
    const notLanded = publicFlight({ ...at("2026-11-10T10:00:00.000Z"), landed: false });
    expect(logbookSummary([bounced, alerted, notLanded], null, NOW).workOn).toEqual({
      flights: 2,
      bouncedLandings: 1,
      alertFlights: 1,
      alerts: ["paused", "simRateChanged"],
      goArounds: 1,
    });
  });

  it("keeps the last 4 flights and the last measured landings, oldest first", () => {
    const flights = Array.from({ length: 6 }, (_, i) =>
      publicFlight({
        ...at(`2026-11-${String(12 - i).padStart(2, "0")}T10:00:00.000Z`),
        vs: -100 - i,
        landed: i !== 1,
      }),
    );
    const summary = logbookSummary(flights, null, NOW);
    expect(summary.recentFlights.map((f) => f.touchdownVs)).toEqual([-100, null, -102, -103]);
    expect(summary.recentLandings.map((l) => l.touchdownVs)).toEqual([
      -105, -104, -103, -102, -100,
    ]);
  });
});
