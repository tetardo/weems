import { describe, expect, it } from "vitest";
import { rankProgress } from "./rank-progress.ts";

describe("rankProgress", () => {
  it("measures each threshold of the next rank and rounds the missing hours up", () => {
    const progress = rankProgress({
      validHours: 268.4,
      validFlights: 151,
      next: { rank: "seniorCaptain", hours: 500, flights: 200 },
    });
    expect(progress.hoursShare).toBeCloseTo(0.537, 3);
    expect(progress.flightsShare).toBeCloseTo(0.755);
    expect(progress).toMatchObject({ missingHours: 232, missingFlights: 49 });
  });

  it("caps a threshold already met", () => {
    const progress = rankProgress({
      validHours: 30,
      validFlights: 4,
      next: { rank: "flyer", hours: 20, flights: 10 },
    });
    expect(progress).toMatchObject({ hoursShare: 1, missingHours: 0, missingFlights: 6 });
  });

  it("is full at the last rank", () => {
    expect(rankProgress({ validHours: 3000, validFlights: 800, next: null })).toEqual({
      hoursShare: 1,
      flightsShare: 1,
      missingHours: 0,
      missingFlights: 0,
    });
  });
});
