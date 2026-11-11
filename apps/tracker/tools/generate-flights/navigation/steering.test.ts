import { describe, expect, it } from "vitest";
import { turnRadiusNm, turnRateDegS, turnToward } from "./steering.ts";

describe("steering", () => {
  it("turns at standard rate (3°/s) at approach speed", () => {
    expect(turnRateDegS(140, false)).toBe(3);
    expect(turnToward({ heading: 90, gs: 140, onGround: false }, 180, 1).heading).toBe(93);
  });

  it("turns slower at cruise speed rather than banking beyond 25°", () => {
    expect(turnRateDegS(450, false)).toBeLessThan(1.5);
    expect(turnToward({ heading: 90, gs: 450, onGround: false }, 180, 1).bank).toBeCloseTo(25, 0);
  });

  it("banks to the side of the turn and stops on the wanted heading", () => {
    expect(turnToward({ heading: 10, gs: 140, onGround: false }, 350, 1).bank).toBeLessThan(0);
    expect(turnToward({ heading: 10, gs: 140, onGround: false }, 11, 1)).toEqual({
      heading: 11,
      bank: expect.any(Number),
    });
  });

  it("never banks on the ground", () => {
    expect(turnToward({ heading: 0, gs: 15, onGround: true }, 90, 1)).toEqual({
      heading: 10,
      bank: 0,
    });
  });

  it("gives the radius of the turn", () => {
    // 140 kt at 3°/s: 2 minutes for 360°, circumference 140 × 2 / 60 NM.
    expect(turnRadiusNm(140, false)).toBeCloseTo((140 * 2) / 60 / (2 * Math.PI), 6);
  });
});
