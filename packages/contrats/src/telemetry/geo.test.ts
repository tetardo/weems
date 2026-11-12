import { describe, expect, it } from "vitest";
import {
  angleDiffDeg,
  bearingDeg,
  crossTrackNm,
  destinationPoint,
  distanceNm,
  normalizeDeg,
} from "./geo.ts";

const PARIS = { lat: 49.0097, lon: 2.5479 };
const TOULOUSE = { lat: 43.6293, lon: 1.3638 };

describe("distanceNm", () => {
  it("counts 60 NM per degree of latitude", () => {
    expect(distanceNm(45, 2, 46, 2)).toBeCloseTo(60, 0);
  });
});

describe("angles", () => {
  it("normalizes into [0, 360)", () => {
    expect(normalizeDeg(-90)).toBe(270);
    expect(normalizeDeg(720)).toBe(0);
  });

  it("gives the shortest signed turn", () => {
    expect(angleDiffDeg(350, 10)).toBe(20);
    expect(angleDiffDeg(10, 350)).toBe(-20);
    expect(angleDiffDeg(0, 180)).toBe(180);
  });
});

describe("great circle", () => {
  it("heads north along a meridian and east along the equator", () => {
    expect(bearingDeg({ lat: 45, lon: 2 }, { lat: 46, lon: 2 })).toBeCloseTo(0, 6);
    expect(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(90, 6);
  });

  it("lands on the destination after flying its distance on the initial course", () => {
    const nm = distanceNm(PARIS.lat, PARIS.lon, TOULOUSE.lat, TOULOUSE.lon);
    const end = destinationPoint(PARIS, bearingDeg(PARIS, TOULOUSE), nm);
    expect(distanceNm(end.lat, end.lon, TOULOUSE.lat, TOULOUSE.lon)).toBeLessThan(0.01);
  });

  it("measures the side and distance off a course", () => {
    const start = { lat: 0, lon: 0 };
    expect(crossTrackNm({ lat: -1 / 60, lon: 1 }, start, 90)).toBeCloseTo(1, 2);
    expect(crossTrackNm({ lat: 1 / 60, lon: 1 }, start, 90)).toBeCloseTo(-1, 2);
  });
});
