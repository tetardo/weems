import type { Boarding, BoardingFlight } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import {
  aircraftType,
  airportCode,
  arrivalTime,
  busiestAirports,
  departureTime,
  forAircraft,
  forAirport,
  pageOf,
  tickerFacts,
  utcTime,
  zoneCity,
} from "./board-rows.ts";

const flight = (extra: Partial<BoardingFlight>): BoardingFlight => ({
  flightId: "0197a000-0000-7000-8000-000000000001",
  callsign: "WMS101",
  aircraftType: "A20N",
  aircraftClass: null,
  departureIcao: "LFLL",
  departureName: null,
  arrivalIcao: "LFMN",
  arrivalName: null,
  pilot: null,
  status: "airborne",
  startedAt: "2026-11-13T08:00:00.000Z",
  takeoffAt: "2026-11-13T08:12:00.000Z",
  estimatedArrivalAt: "2026-11-13T09:05:00.000Z",
  landedAt: null,
  touchdownVs: null,
  closed: false,
  fictitious: false,
  ...extra,
});
const board = (departures: BoardingFlight[], arrivals: BoardingFlight[]): Boarding => ({
  generatedAt: "2026-11-13T09:00:00.000Z",
  departures,
  arrivals,
});

describe("Boarding rows", () => {
  it("reads an airport code from the address or the filter", () => {
    expect(airportCode(" lfml ")).toBe("LFML");
    expect(airportCode("Marseille")).toBeNull();
    expect(airportCode(null)).toBeNull();
  });

  it("keeps the departures leaving an airport and the arrivals going to it", () => {
    const lyon = flight({ callsign: "A" });
    const nice = flight({ callsign: "B", departureIcao: "LFMN", arrivalIcao: "LFLL" });
    const filtered = forAirport(board([lyon, nice], [lyon, nice]), "LFLL");
    expect(filtered.departures.map((f) => f.callsign)).toEqual(["A"]);
    expect(filtered.arrivals.map((f) => f.callsign)).toEqual(["B"]);
  });

  it("keeps one aircraft type on both boards", () => {
    const neo = flight({ callsign: "A" });
    const boeing = flight({ callsign: "B", aircraftType: "B738" });
    const filtered = forAircraft(board([neo, boeing], [boeing, neo]), aircraftType(" B738 "));
    expect(filtered.departures.map((f) => f.callsign)).toEqual(["B"]);
    expect(filtered.arrivals.map((f) => f.callsign)).toEqual(["B"]);
    expect(aircraftType("  ")).toBeNull();
  });

  it("ranks the busiest airports, departures and arrivals together", () => {
    const flights = [
      flight({}),
      flight({ departureIcao: "LFPG" }),
      flight({ arrivalIcao: "LFPG" }),
    ];
    // LFLL 2 departures, LFMN 2 arrivals, LFPG 1 + 1: a tie is broken by the code.
    expect(busiestAirports(board(flights, flights), 2)).toEqual([
      { icao: "LFLL", count: 2 },
      { icao: "LFMN", count: 2 },
    ]);
  });

  it("turns the pages and wraps round", () => {
    const rows = Array.from({ length: 25 }, (_, i) => i);
    expect(pageOf(rows, 0)).toMatchObject({ page: 0, pages: 3, rows: rows.slice(0, 12) });
    expect(pageOf(rows, 2).rows).toEqual([24]);
    expect(pageOf(rows, 3).page).toBe(0);
    expect(pageOf([], 5)).toEqual({ rows: [], page: 0, pages: 1 });
  });

  it("dates a departure by its take-off, or its start while on the ground", () => {
    expect(departureTime(flight({}))).toBe("2026-11-13T08:12:00.000Z");
    expect(departureTime(flight({ status: "taxi", takeoffAt: null }))).toBe(
      "2026-11-13T08:00:00.000Z",
    );
    expect(utcTime(departureTime(flight({})))).toBe("08:12");
  });

  it("dates an arrival by its estimate, then by its touchdown", () => {
    expect(arrivalTime(flight({}))).toEqual({ at: "2026-11-13T09:05:00.000Z", estimated: true });
    const landed = flight({ status: "landed", landedAt: "2026-11-13T08:58:00.000Z" });
    expect(arrivalTime(landed)).toEqual({ at: "2026-11-13T08:58:00.000Z", estimated: false });
    expect(utcTime(null)).toBe("--:--");
  });

  it("finds the softest recent touchdown", () => {
    const arrivals = [
      flight({ callsign: "HARD", touchdownVs: -412 }),
      flight({ callsign: "SOFT", touchdownVs: -118 }),
      flight({ callsign: "AIR" }),
    ];
    expect(tickerFacts(board([], arrivals)).softest).toEqual({
      callsign: "SOFT",
      touchdownVs: -118,
    });
    expect(tickerFacts(board([], []))).toEqual({ busiest: null, softest: null });
  });

  it("names the city of the local clock", () => {
    expect(zoneCity("Europe/Paris")).toBe("Paris");
    expect(zoneCity("America/New_York")).toBe("New York");
    expect(zoneCity("UTC")).toBe("UTC");
  });
});
