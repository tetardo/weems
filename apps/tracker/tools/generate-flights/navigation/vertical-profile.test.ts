import { describe, expect, it } from "vitest";
import { seededRandom } from "../random.ts";
import {
  cruiseCeilingFt,
  drawTouchdownVs,
  flareVs,
  mustLevelOff,
  pathAltitudeFt,
  pathDistanceNm,
  pathVs,
} from "./vertical-profile.ts";

describe("vertical profile", () => {
  it("keeps the wanted cruise level on a long route, lowers it on a short one", () => {
    expect(cruiseCeilingFt(35000, 400, 400, 500)).toBe(35000);
    const short = cruiseCeilingFt(35000, 60, 400, 500);
    expect(short).toBeLessThan(15000);
    expect(short % 1000).toBe(0);
  });

  it("levels off when climbing further would leave no level flight before the descent", () => {
    expect(mustLevelOff(10000, 100, 300, 0)).toBe(false);
    expect(mustLevelOff(10000, pathDistanceNm(10000, 0) + 5, 300, 0)).toBe(true);
  });

  it("follows a 3° path (about 318 ft per NM) above the arrival elevation", () => {
    expect(pathAltitudeFt(10, 1400)).toBe(1400 + 3180);
    expect(pathDistanceNm(1400 + 3180, 1400)).toBeCloseTo(10, 6);
  });

  it("stays level below the path, then descends at the rate of the path", () => {
    expect(pathVs(3000, 4000, 140, 0)).toBe(0);
    expect(pathVs(4001, 4000, 140, 0)).toBeCloseTo(-743, 0);
    expect(pathVs(4500, 4000, 140, -742)).toBeLessThan(-742);
  });

  it("never shallows to a level-off once descending", () => {
    expect(pathVs(3000, 4000, 140, -742)).toBe(-400);
  });

  it("flares to the touchdown rate", () => {
    expect(flareVs(500, -742, -150)).toBe(-742);
    expect(flareVs(0, -742, -150)).toBe(-150);
    expect(flareVs(10, -742, -150)).toBeCloseTo(-446, 0);
  });

  it("draws varied touchdown rates, mostly gentle", () => {
    const random = seededRandom(1);
    const rates = Array.from({ length: 1000 }, () => drawTouchdownVs(random));
    expect(Math.max(...rates)).toBeLessThan(-59);
    expect(Math.min(...rates)).toBeGreaterThan(-701);
    const gentle = rates.filter((vs) => vs > -300).length;
    expect(gentle).toBeGreaterThan(500);
    expect(gentle).toBeLessThan(900);
  });
});
