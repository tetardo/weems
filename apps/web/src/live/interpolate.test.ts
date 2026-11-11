import { describe, expect, it } from "vitest";
import { interpolate } from "./interpolate.ts";

describe("interpolate", () => {
  const from = { lat: 45, lon: 5, heading: 10 };
  const to = { lat: 46, lon: 7, heading: 30 };

  it("moves linearly between the two points", () => {
    expect(interpolate(from, to, 0.5)).toEqual({ lat: 45.5, lon: 6, heading: 20 });
  });

  it("stays on the end points outside 0 to 1", () => {
    expect(interpolate(from, to, -1)).toEqual(from);
    expect(interpolate(from, to, 3)).toEqual(to);
  });

  it("turns the short way across north", () => {
    const turn = interpolate({ ...from, heading: 350 }, { ...to, heading: 10 }, 0.5);
    expect(turn.heading).toBeCloseTo(0);
    const back = interpolate({ ...from, heading: 10 }, { ...to, heading: 350 }, 0.25);
    expect(back.heading).toBeCloseTo(5);
  });
});
