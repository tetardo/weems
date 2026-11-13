import { describe, expect, it } from "vitest";
import { routeProgress } from "./route-progress.ts";

const LFPG = { lat: 49.009, lon: 2.5541 };
const LFBO = { lat: 43.6291, lon: 1.3638 };
const halfway = { lat: 46.32, lon: 1.97 };

describe("route progress", () => {
  it("gives the share flown, the distance left and the time left at the current speed", () => {
    const progress = routeProgress({ ...halfway, gs: 326 }, LFPG, LFBO);
    expect(progress?.fraction).toBeCloseTo(0.5, 1);
    expect(progress?.remainingNm).toBeCloseTo(163, -1);
    expect((progress?.flownNm ?? 0) + (progress?.remainingNm ?? 0)).toBeCloseTo(326, -1);
    expect(progress?.remainingMinutes).toBeCloseTo(30, -1);
  });

  it("is 0 at departure and 1 at arrival, with no time left on the ground", () => {
    expect(routeProgress({ ...LFPG, gs: 0 }, LFPG, LFBO)).toMatchObject({
      fraction: 0,
      remainingMinutes: null,
    });
    expect(routeProgress({ ...LFBO, gs: 140 }, LFPG, LFBO)).toMatchObject({
      fraction: 1,
      remainingNm: 0,
    });
  });

  it("is unknown without a departure or an arrival airport", () => {
    expect(routeProgress({ ...halfway, gs: 400 }, LFPG, null)).toBeNull();
    expect(routeProgress({ ...halfway, gs: 400 }, null, LFBO)).toBeNull();
  });
});
