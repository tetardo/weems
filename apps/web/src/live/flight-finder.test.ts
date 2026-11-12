import { describe, expect, it } from "vitest";
import type { Airports } from "./airport-book.ts";
import { searchFlights, sortFlights } from "./flight-finder.ts";
import type { LiveFlights } from "./flights-store.ts";
import { liveFlight } from "./testing/live-flight.ts";

const pilot = { handle: "helene-v", name: "Hélène Vidal", country: "FR", hasPhoto: false };
const flights: LiveFlights = new Map(
  [
    liveFlight("a", { callsign: "WMS251", departureIcao: "LFPG", plannedArrivalIcao: "EGCC" }),
    liveFlight("b", { callsign: "AFR12", pilot }),
    liveFlight("c", { callsign: "XWMS9", departureIcao: "EGLL", plannedArrivalIcao: "LFPG" }),
  ].map((flight) => [flight.flightId, flight]),
);
const ids = (found: { flightId: string }[]) => found.map((flight) => flight.flightId);

describe("search on the live map", () => {
  it("finds callsigns, starting ones first", () => {
    expect(ids(searchFlights(flights, "wms"))).toEqual(["a", "c"]);
  });

  it("finds a public pilot by name without accents, or by handle", () => {
    expect(ids(searchFlights(flights, "helene"))).toEqual(["b"]);
    expect(ids(searchFlights(flights, "vidal"))).toEqual(["b"]);
  });

  it("finds the flights of an airport, departing or arriving", () => {
    expect(ids(searchFlights(flights, "LFPG"))).toEqual(["a", "c"]);
  });

  it("answers nothing to an empty search", () => {
    expect(searchFlights(flights, "  ")).toEqual([]);
  });
});

describe("« En vol » list", () => {
  const airports: Airports = new Map([
    ["LFLL", { icao: "LFLL", name: "Lyon", lat: 45.73, lon: 5.08 }],
    ["LFMN", { icao: "LFMN", name: "Nice", lat: 43.66, lon: 7.22 }],
  ]);
  const list: LiveFlights = new Map(
    [
      liveFlight("far", { callsign: "B1" }),
      liveFlight("near", {
        callsign: "C1",
        position: { ...liveFlight("x").position, lat: 43.8, lon: 7, phase: "APPROACH" },
      }),
      liveFlight("unknown", {
        callsign: "A1",
        plannedArrivalIcao: null,
        position: { ...liveFlight("x").position, phase: "DESCENT" },
      }),
    ].map((flight) => [flight.flightId, flight]),
  );

  it("puts the flight closest to its arrival first, and unknown routes last", () => {
    expect(ids(sortFlights(list, airports, "arrival"))).toEqual(["near", "far", "unknown"]);
  });

  it("sorts by callsign, or by phase in flight order", () => {
    expect(ids(sortFlights(list, airports, "callsign"))).toEqual(["unknown", "far", "near"]);
    expect(ids(sortFlights(list, airports, "phase"))).toEqual(["far", "unknown", "near"]);
  });
});
