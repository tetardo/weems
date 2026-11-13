import { describe, expect, it } from "vitest";
import {
  DIAL,
  DIAL_ROUTES,
  type DialFlight,
  easeInOut,
  flightShape,
  labelPlace,
  mixFlights,
  ringTicks,
  scrambleCode,
} from "./route-dial-geometry.ts";

const straight: DialFlight = {
  from: { code: "LFML", at: [100, 230] },
  to: { code: "LSZH", at: [500, 230] },
  bend: [300, 230],
  progress: 0.5,
};

describe("flightShape", () => {
  it("splits the route at the aircraft", () => {
    const shape = flightShape(straight);
    expect(shape.flown).toBe("M100 230Q200 230 300 230");
    expect(shape.remaining).toBe("M300 230Q400 230 500 230");
  });

  it("points the aircraft along the route (nose up = 0°, east = 90°)", () => {
    expect(flightShape(straight).aircraft).toBe("translate(300 230) rotate(90) scale(.85)");
    const north = flightShape({ ...straight, to: { code: "X", at: [100, 30] }, bend: [100, 130] });
    expect(north.aircraft).toContain("rotate(0)");
  });
});

describe("labelPlace", () => {
  it("pushes the label away from the centre", () => {
    expect(labelPlace([100, 230])).toEqual({ x: 84, y: 234, anchor: "end" });
    expect(labelPlace([500, 230])).toEqual({ x: 516, y: 234, anchor: "start" });
    expect(labelPlace([300, 100]).anchor).toBe("middle");
  });
});

describe("mixFlights", () => {
  const other: DialFlight = {
    from: { code: "LFPG", at: [200, 100] },
    to: { code: "LIRF", at: [400, 300] },
    bend: [300, 100],
    progress: 1,
  };

  it("goes from the first flight to the second, with the second's codes", () => {
    expect(mixFlights(straight, other, 0).from.at).toEqual(straight.from.at);
    expect(mixFlights(straight, other, 1)).toEqual(other);
    const half = mixFlights(straight, other, 0.5);
    expect(half.from).toEqual({ code: "LFPG", at: [150, 165] });
    expect(half.progress).toBe(0.75);
  });
});

describe("scrambleCode", () => {
  it("shows random letters first, then the code", () => {
    expect(scrambleCode("LFML", 0, () => 0)).toBe("AAAA");
    expect(scrambleCode("LFML", 0.5, () => 0)).toBe("LFAA");
    expect(scrambleCode("LFML", 1, () => 0)).toBe("LFML");
  });
});

describe("easeInOut", () => {
  it("starts at 0, ends at 1, half way at the middle", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
  });
});

describe("dial", () => {
  it("has 72 ticks, 12 long ones", () => {
    const ticks = ringTicks();
    expect(ticks).toHaveLength(72);
    expect(ticks.filter((tick) => tick.major)).toHaveLength(12);
  });

  it("keeps every airport inside the ring", () => {
    for (const pair of DIAL_ROUTES) {
      for (const flight of pair) {
        for (const { at } of [flight.from, flight.to]) {
          const distance = Math.hypot(at[0] - DIAL.center[0], at[1] - DIAL.center[1]);
          expect(distance).toBeLessThan(DIAL.radius - 8);
        }
      }
    }
  });
});
