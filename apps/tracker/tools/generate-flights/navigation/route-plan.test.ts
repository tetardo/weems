import { describe, expect, it } from "vitest";
import { angleDiffDeg, bearingDeg, crossTrackNm, destinationPoint } from "../../../src/core/geo.ts";
import { airportOf, type RunwayEnd } from "../airports/airport-data.ts";
import { arrivalLegs, circuitLegs, pickRunway } from "./route-plan.ts";

const RUNWAY: RunwayEnd = {
  ident: "36",
  lat: 45,
  lon: 5,
  headingDeg: 0,
  lengthFt: 10000,
  elevationFt: 500,
  displacedThresholdFt: 0,
};
const from = (bearing: number) => destinationPoint(RUNWAY, bearing, 200);
const finalOf = (legs: ReturnType<typeof arrivalLegs>) => legs[legs.length - 1];

describe("route plan", () => {
  it("picks a runway into the wind (from 270)", () => {
    for (let seed = 0; seed < 20; seed++) {
      const runway = pickRunway(airportOf("LFPG"), () => seed / 20);
      expect(Math.abs(angleDiffDeg(runway.headingDeg, 270))).toBeLessThanOrEqual(90);
    }
  });

  it("ends every approach on the runway axis, at the aiming point", () => {
    const final = finalOf(arrivalLegs(RUNWAY, from(180)));
    expect(final?.course).toBe(0);
    expect(crossTrackNm(final?.fix ?? RUNWAY, RUNWAY, 0)).toBeCloseTo(0, 6);
    expect(final?.fix.lat).toBeGreaterThan(RUNWAY.lat);
  });

  it("comes straight in from behind the runway", () => {
    expect(arrivalLegs(RUNWAY, from(190))).toHaveLength(2);
  });

  it("joins a base leg on the side it comes from", () => {
    const [base] = arrivalLegs(RUNWAY, from(90));
    expect(bearingDeg(RUNWAY, base?.fix ?? RUNWAY)).toBeGreaterThan(90);
    expect(bearingDeg(RUNWAY, base?.fix ?? RUNWAY)).toBeLessThan(180);
  });

  it("flies a downwind past the airport when coming from ahead", () => {
    const legs = arrivalLegs(RUNWAY, from(0));
    expect(legs).toHaveLength(4);
    expect(legs[0]?.fix.lat).toBeGreaterThan(RUNWAY.lat);
  });

  it("flies a left-hand circuit after a go-around", () => {
    const [climbOut, downwind] = circuitLegs(RUNWAY);
    expect(climbOut?.course).toBe(0);
    // Left of a northbound runway: west.
    expect(downwind?.fix.lon).toBeLessThan(RUNWAY.lon);
  });
});
