import type { LiveRoute } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { aircraftLines, airportPoints, trailLine } from "./route-geojson.ts";
import { testAirport } from "./testing/airport.ts";

const route: LiveRoute = {
  departure: testAirport("LFPG", "Paris CDG", 49.009, 2.5541),
  arrival: testAirport("LFBO", "Toulouse", 43.6291, 1.3638),
  trail: [
    [2.5541, 49.009],
    [2.3, 48],
  ],
};
const aircraft = { lat: 47.5, lon: 2.1 };
const kinds = (collection: { features: { properties: unknown }[] }) =>
  collection.features.map((feature) => (feature.properties as { kind: string }).kind);

describe("route geojson", () => {
  it("draws the trail once it has two points", () => {
    expect(trailLine(route).features[0]?.geometry.coordinates).toEqual(route.trail);
    expect(trailLine({ ...route, trail: [[2.5, 49]] }).features).toEqual([]);
    expect(trailLine(null).features).toEqual([]);
  });

  it("joins the trail to the aircraft and draws the great circle ahead to the arrival", () => {
    const lines = aircraftLines(route, aircraft);
    expect(kinds(lines)).toEqual(["flown", "ahead"]);
    expect(lines.features[0]?.geometry.coordinates).toEqual([
      [2.3, 48],
      [2.1, 47.5],
    ]);
    const ahead = lines.features[1]?.geometry.coordinates ?? [];
    expect(ahead[0]).toEqual([2.1, 47.5]);
    expect(ahead.at(-1)?.[1]).toBeCloseTo(43.6291);
  });

  it("draws nothing ahead without an arrival, nor anything without an aircraft", () => {
    expect(kinds(aircraftLines({ ...route, arrival: null }, aircraft))).toEqual(["flown"]);
    expect(kinds(aircraftLines({ ...route, trail: [] }, aircraft))).toEqual(["ahead"]);
    expect(aircraftLines(route, undefined).features).toEqual([]);
  });

  it("marks the known airports", () => {
    expect(kinds(airportPoints(route))).toEqual(["departure", "arrival"]);
    expect(kinds(airportPoints({ ...route, departure: null }))).toEqual(["arrival"]);
  });
});
