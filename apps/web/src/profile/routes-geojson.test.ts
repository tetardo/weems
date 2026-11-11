import { describe, expect, it } from "vitest";
import {
  airportPoints,
  greatCircle,
  routeLines,
  routeWidth,
  routesBounds,
} from "./routes-geojson.ts";

const LFPG = { icao: "LFPG", lat: 49.01, lon: 2.55 };
const KJFK = { icao: "KJFK", lat: 40.64, lon: -73.78 };
const RJTT = { icao: "RJTT", lat: 35.55, lon: 139.78 };
const KSFO = { icao: "KSFO", lat: 37.62, lon: -122.38 };

describe("map of the routes", () => {
  it("bends the arc north, as the great circle Paris - New York does", () => {
    const arc = greatCircle(LFPG, KJFK);
    expect(arc[0]).toEqual([expect.closeTo(2.55, 5), expect.closeTo(49.01, 5)]);
    expect(arc.at(-1)).toEqual([expect.closeTo(-73.78, 5), expect.closeTo(40.64, 5)]);
    const north = Math.max(...arc.map(([, lat]) => lat));
    expect(north).toBeGreaterThan(51);
  });

  it("crosses the Pacific without jumping around the world", () => {
    const arc = greatCircle(RJTT, KSFO);
    for (let i = 1; i < arc.length; i++) {
      expect(Math.abs((arc[i]?.[0] ?? 0) - (arc[i - 1]?.[0] ?? 0))).toBeLessThan(10);
    }
    expect(arc.at(-1)?.[0]).toBeCloseTo(-122.38 + 360, 5);
  });

  it("draws routes thicker when flown often, one point per airport", () => {
    expect(routeWidth(1)).toBe(1.5);
    expect(routeWidth(8)).toBeGreaterThan(routeWidth(2));
    const routes = [
      { from: LFPG, to: KJFK, flights: 4 },
      { from: KJFK, to: LFPG, flights: 1 },
    ];
    expect(routeLines(routes).features).toHaveLength(2);
    expect(airportPoints(routes).features.map((f) => f.properties?.["label"])).toEqual([
      "LFPG",
      "KJFK",
    ]);
    expect(routesBounds([])).toBeNull();
    expect(routesBounds(routes)?.[0][0]).toBeCloseTo(-73.78, 1);
  });
});
