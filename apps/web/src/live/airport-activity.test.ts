import { describe, expect, it } from "vitest";
import type { Airports } from "./airport-book.ts";
import { activeAirports } from "./airport-activity.ts";
import type { LiveFlights } from "./flights-store.ts";
import { liveFlight } from "./testing/live-flight.ts";

describe("busy airports of the live map", () => {
  it("counts departures and arrivals in progress, leaving out unknown airports", () => {
    const flights: LiveFlights = new Map(
      [
        liveFlight("a"),
        liveFlight("b", { departureIcao: "LFMN", plannedArrivalIcao: "LFLL" }),
        liveFlight("c", { departureIcao: "ZZZZ", plannedArrivalIcao: "LFLL" }),
        liveFlight("d", { departureIcao: "LFLL", plannedArrivalIcao: "LFLL" }),
      ].map((flight) => [flight.flightId, flight]),
    );
    const airports: Airports = new Map([
      ["LFLL", { icao: "LFLL", name: "Lyon", lat: 45.73, lon: 5.08 }],
      ["LFMN", { icao: "LFMN", name: "Nice", lat: 43.66, lon: 7.22 }],
      ["ZZZZ", null],
    ]);
    const found = activeAirports(flights, airports).features.map((f) => f.properties);
    expect(found).toEqual([
      { icao: "LFLL", count: 4 },
      { icao: "LFMN", count: 2 },
    ]);
  });
});
