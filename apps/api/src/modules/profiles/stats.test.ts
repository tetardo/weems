import { describe, expect, it } from "vitest";
import {
  publicFlight,
  trackPoint,
  type PublicFlightOptions,
} from "../../testing/public-flights.ts";
import { routesOf } from "./route-map.ts";
import { pilotStats } from "./stats.ts";

const NOW = new Date("2026-11-20T00:00:00.000Z");
const flight = (over: PublicFlightOptions = {}, extra: PublicFlightOptions["extra"] = []) =>
  publicFlight({ ...over, extra });

describe("statistics of a public profile", () => {
  it("is empty without flights", () => {
    expect(pilotStats([], new Map(), NOW)).toMatchObject({
      flights: 0,
      averageTouchdownVs: null,
      bestLanding: null,
      longestFlight: null,
      favoriteAircraft: null,
    });
  });

  it("sums times, counts airports and aircraft, finds the softest landing", () => {
    const stats = pilotStats(
      [
        flight({ vs: -200 }, ["goAround"]),
        flight({ model: "B738", dep: "LFBO", arr: "EGLL", blockS: 7200, vs: -60 }),
        flight({ vs: null }),
      ],
      new Map(),
      NOW,
    );
    expect(stats).toMatchObject({
      flights: 3,
      blockS: 14_400,
      airborneS: 12_600,
      airports: 3,
      aircraft: 2,
      favoriteAircraft: "Title A20N",
      averageTouchdownVs: -130,
      goArounds: 1,
      longestFlight: { blockS: 7200, departureIcao: "LFBO", arrivalIcao: "EGLL" },
    });
    expect(stats.bestLanding).toMatchObject({ touchdownVs: -60, airportIcao: "EGLL" });
  });

  it("counts clean final landings: one touchdown, no go-around", () => {
    const stats = pilotStats(
      [flight(), flight({}, ["bounce"]), flight({}, ["goAround"]), flight({ landed: false })],
      new Map(),
      NOW,
    );
    expect(stats.cleanLandings).toEqual({ clean: 1, landings: 3 });
  });

  it("adds up the length of the trajectories, in nautical miles", () => {
    const track = [trackPoint({ lat: 45, lon: 2 }), trackPoint({ lat: 46, lon: 2 })];
    const stats = pilotStats([flight()], new Map([["any", track]]), NOW);
    expect(stats.distanceNm).toBeCloseTo(60, 0);
  });
});

describe("map of a public profile", () => {
  it("groups flights by direction and skips those without trajectory", () => {
    const point = (lat: number, lon: number) => trackPoint({ lat, lon, onGround: true });
    const [a, b, back, none] = [flight(), flight(), flight({ dep: "LFBO", arr: "LFPG" }), flight()];
    const ends = new Map(
      [a, b].map((f) => [f.summary.flightId, { first: point(49, 2.5), last: point(43.6, 1.4) }]),
    );
    ends.set(back.summary.flightId, { first: point(43.6, 1.4), last: point(49, 2.5) });
    const routes = routesOf(
      [a, b, back, none].map((f) => f.summary),
      ends,
    );
    expect(routes).toEqual([
      {
        from: { icao: "LFPG", lat: 49, lon: 2.5 },
        to: { icao: "LFBO", lat: 43.6, lon: 1.4 },
        flights: 2,
      },
      {
        from: { icao: "LFBO", lat: 43.6, lon: 1.4 },
        to: { icao: "LFPG", lat: 49, lon: 2.5 },
        flights: 1,
      },
    ]);
  });
});
