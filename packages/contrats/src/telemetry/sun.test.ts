import { describe, expect, it } from "vitest";
import { subsolarPoint, sunElevationDeg } from "./sun.ts";

const PARIS = { lat: 48.86, lon: 2.35 };

describe("sun elevation", () => {
  it("is overhead the tropic at the June solstice noon", () => {
    expect(sunElevationDeg(new Date("2026-06-21T12:00:00Z"), 23.44, 0)).toBeGreaterThan(89);
  });

  it("follows the civil twilight in Paris on 11 November 2026 (sunset about 16:15 UTC)", () => {
    const at = (time: string) =>
      sunElevationDeg(new Date(`2026-11-11T${time}Z`), PARIS.lat, PARIS.lon);
    expect(at("12:00")).toBeGreaterThan(20);
    expect(at("16:30")).toBeLessThan(0);
    expect(at("16:30")).toBeGreaterThan(-6);
    expect(at("17:15")).toBeLessThan(-6);
  });
});

describe("subsolar point", () => {
  it("is on the tropic of Cancer near Greenwich at the June solstice noon", () => {
    const sun = subsolarPoint(new Date("2026-06-21T12:00:00Z"));
    expect(sun.lat).toBeCloseTo(23.44, 0);
    expect(Math.abs(sun.lon)).toBeLessThan(1);
  });

  it("is south of the equator over the Pacific on 12 November 2026 at 00:00 UTC", () => {
    const sun = subsolarPoint(new Date("2026-11-12T00:00:00Z"));
    expect(sun.lat).toBeLessThan(-17);
    expect(Math.abs(sun.lon)).toBeGreaterThan(175);
  });
});
