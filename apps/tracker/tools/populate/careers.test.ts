import { distanceBetweenNm, PilotRank, RANK_THRESHOLDS } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { seededRandom } from "../generate-flights/random.ts";
import { careerLegs, careerTarget } from "./careers.ts";

/** Highest rank whose two thresholds the totals meet (the API's rule, spec grades). */
const rankOf = (hours: number, flights: number) =>
  PilotRank.options.findLast(
    (rank) => hours >= RANK_THRESHOLDS[rank].hours && flights >= RANK_THRESHOLDS[rank].flights,
  );

describe("careers of the fictitious pilots", () => {
  const random = seededRandom(11);

  it.each(PilotRank.options)("reaches %s, with margin, and not the next rank", (rank) => {
    const legs = careerLegs(careerTarget(rank, random), "LFPG", random);
    const hours = legs.reduce((sum, leg) => sum + leg.estimatedHours, 0);
    // Estimates are within ±10 % of the generated flights: the rank holds at both ends.
    expect(rankOf(hours * 0.9, legs.length)).toBe(rank);
    expect(rankOf(hours * 1.1, legs.length)).toBe(rank);
  });

  it("chains valid legs from home: 15 min in the air and 20 NM at least", () => {
    const legs = careerLegs(careerTarget("captain", random), "LFLL", random);
    expect(legs[0]?.from.icao).toBe("LFLL");
    legs.forEach((leg, i) => {
      if (i > 0) expect(leg.from.icao).toBe(legs[i - 1]?.to.icao);
      expect(leg.estimatedHours).toBeGreaterThan(0.25);
      expect(distanceBetweenNm(leg.from, leg.to)).toBeGreaterThan(20);
    });
  });
});
