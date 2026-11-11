import { describe, expect, it } from "vitest";
import { angleDiffDeg, destinationPoint, distanceNm } from "../../../src/core/geo.ts";
import { legsNm, Navigator } from "./navigator.ts";

const ORIGIN = { lat: 45, lon: 5 };
const north = (nm: number) => destinationPoint(ORIGIN, 0, nm);

describe("Navigator", () => {
  it("flies direct to the fix of a leg", () => {
    const navigator = new Navigator();
    navigator.follow([{ fix: destinationPoint(ORIGIN, 90, 20) }]);
    expect(navigator.desiredHeading(ORIGIN, 1)).toBeCloseTo(90, 0);
  });

  it("intercepts a course at 30° when far from it, less when close", () => {
    const navigator = new Navigator();
    navigator.follow([{ fix: north(20), course: 0 }]);
    const east = (nm: number) => destinationPoint(ORIGIN, 90, nm);
    expect(navigator.desiredHeading(east(2), 1)).toBeCloseTo(330, 0);
    expect(navigator.desiredHeading(east(0.1), 1)).toBeCloseTo(351, 0);
    expect(angleDiffDeg(0, navigator.desiredHeading(ORIGIN, 1) ?? 90)).toBeCloseTo(0, 6);
  });

  it("starts the turn to the next leg one lead distance before the fix", () => {
    const navigator = new Navigator();
    const corner = north(10);
    navigator.follow([{ fix: corner }, { fix: destinationPoint(corner, 90, 10) }]);
    // 90° turn with a 1 NM radius: lead of 1 NM.
    expect(navigator.desiredHeading(north(8.9), 1)).toBeCloseTo(0, 0);
    expect(navigator.desiredHeading(north(9.1), 1)).toBeGreaterThan(80);
  });

  it("keeps the course of the last leg after its fix", () => {
    const navigator = new Navigator();
    navigator.follow([{ fix: north(1), course: 0 }]);
    expect(angleDiffDeg(0, navigator.desiredHeading(north(3), 1) ?? 90)).toBeCloseTo(0, 6);
  });

  it("measures the distance left along the legs", () => {
    const navigator = new Navigator();
    const legs = [{ fix: north(10) }, { fix: north(25) }];
    navigator.follow(legs);
    expect(navigator.remainingNm(ORIGIN)).toBeCloseTo(25, 3);
    expect(legsNm(ORIGIN, legs)).toBeCloseTo(25, 3);
    const end = legs[1]?.fix ?? ORIGIN;
    expect(distanceNm(ORIGIN.lat, ORIGIN.lon, end.lat, end.lon)).toBeCloseTo(25, 3);
  });
});
