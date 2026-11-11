import { describe, expect, it } from "vitest";
import { distanceNm, greatCircle, unwrapLongitudes } from "./great-circle.ts";

const LFPG = { lat: 49.009, lon: 2.5541 };
const LFBO = { lat: 43.6291, lon: 1.3638 };
const KJFK = { lat: 40.6394, lon: -73.7793 };

describe("great circle", () => {
  it("measures distances in nautical miles", () => {
    expect(distanceNm(LFPG, LFBO)).toBeCloseTo(327, 0);
    expect(distanceNm(LFPG, KJFK)).toBeCloseTo(3_150, -1);
    expect(distanceNm(LFPG, LFPG)).toBe(0);
  });

  it("goes from one end to the other, curving north between Paris and New York", () => {
    const points = greatCircle(LFPG, KJFK);
    expect(points[0]?.[0]).toBeCloseTo(LFPG.lon);
    expect(points.at(-1)?.[1]).toBeCloseTo(KJFK.lat);
    expect(Math.max(...points.map(([, lat]) => lat))).toBeGreaterThan(51);
  });

  it("crosses the antimeridian the short way, with continuous longitudes", () => {
    const tokyo = { lat: 35.55, lon: 139.78 };
    const anchorage = { lat: 61.17, lon: -149.99 };
    const points = greatCircle(tokyo, anchorage);
    expect(points.at(-1)?.[0]).toBeCloseTo(-149.99 + 360);
    points.slice(1).forEach(([lon], i) => {
      expect(Math.abs(lon - (points[i]?.[0] ?? lon))).toBeLessThan(10);
    });
  });

  it("gives two points for a zero-length route", () => {
    expect(greatCircle(LFPG, LFPG)).toHaveLength(2);
  });
});

describe("unwrap longitudes", () => {
  it("keeps a trail over the antimeridian continuous, next to a given start", () => {
    expect(
      unwrapLongitudes(
        [
          [179, 50],
          [-179, 51],
        ],
        -181,
      ),
    ).toEqual([
      [-181, 50],
      [-179, 51],
    ]);
  });
});
