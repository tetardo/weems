import type { FlightEvent } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import type { SummaryWithEvents } from "../flights/service.ts";
import { routesOf } from "./route-map.ts";
import { pilotStats } from "./stats.ts";

const NOW = new Date("2026-11-20T00:00:00.000Z");
let n = 0;
function flight(
  over: { model?: string; dep?: string; arr?: string; blockS?: number; vs?: number | null } = {},
  extra: FlightEvent["type"][] = [],
): SummaryWithEvents {
  const { model = "A20N", dep = "LFPG", arr = "LFBO", blockS = 3600, vs = -150 } = over;
  const flightId = `01970000-0000-7000-8000-${String(++n).padStart(12, "0")}`;
  const at = "2026-11-11T09:00:00.000Z";
  const events: FlightEvent[] = extra.map((type, i) => ({ seq: i + 1, at, type, context: {} }));
  if (vs !== undefined)
    events.push({ seq: 99, at, type: "touchdown", context: vs === null ? {} : { vs } });
  return {
    summary: {
      flightId,
      callsign: "WMS1",
      aircraftTitle: `Title ${model}`,
      aircraftModel: model,
      departureIcao: dep,
      plannedArrivalIcao: arr,
      openedAt: at,
      closedAt: at,
      closeReason: "normal",
      times: { blockS, airborneS: blockS - 600, pausedS: 0 },
      alerts: [],
    },
    events,
  };
}

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
});

describe("map of a public profile", () => {
  it("groups flights by direction and skips those without trajectory", () => {
    const point = (lat: number, lon: number) => ({
      at: "2026-11-11T09:00:00.000Z",
      lat,
      lon,
      altMsl: 0,
      altAgl: 0,
      ias: 0,
      gs: 0,
      vs: 0,
      heading: 0,
      onGround: true,
    });
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
