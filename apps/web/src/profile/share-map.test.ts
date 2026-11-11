import { describe, expect, it } from "vitest";
import { shareMap } from "./share-map.ts";

const end = (icao: string, lat: number, lon: number) => ({ icao, lat, lon });

describe("share image map", () => {
  it("is empty without route", () => {
    expect(shareMap([], 500, 300)).toEqual({ lines: [], airports: [] });
  });

  it("fits the arcs in the box, with one dot per airport", () => {
    const routes = [
      { from: end("LFBO", 43.63, 1.37), to: end("EGLL", 51.47, -0.45), flights: 4, category: null },
      { from: end("EGLL", 51.47, -0.45), to: end("LFBO", 43.63, 1.37), flights: 1, category: null },
    ];
    const map = shareMap(routes, 500, 300, 10);
    expect(map.lines).toHaveLength(2);
    expect(map.lines[0]?.width).toBeGreaterThan(map.lines[1]?.width ?? 0);
    expect(map.airports).toHaveLength(2);
    for (const [x, y] of map.airports) {
      expect(x).toBeGreaterThanOrEqual(10);
      expect(x).toBeLessThanOrEqual(490);
      expect(y).toBeGreaterThanOrEqual(10);
      expect(y).toBeLessThanOrEqual(290);
    }
    // Toulouse is south of London: lower on the image.
    const [toulouse, london] = map.airports;
    expect(toulouse?.[1]).toBeGreaterThan(london?.[1] ?? 0);
  });
});
