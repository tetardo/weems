import { describe, expect, it } from "vitest";
import type { PositionReport } from "@weems/contrats";
import { followedRoute, withPosition } from "./followed-trail.ts";

const at = (seconds: number, lon = 5): PositionReport => ({
  seq: seconds,
  at: new Date(Date.UTC(2026, 10, 13, 8, 0, seconds)).toISOString(),
  lat: 43,
  lon,
  altMsl: 30000,
  gs: 450,
  heading: 90,
  vs: 0,
  phase: "CRUISE",
  onGround: false,
});

describe("trail of the followed flight, grown from the stream", () => {
  const start = followedRoute("f1", { departure: null, arrival: null, trail: [[4, 43]] });

  it("adds the first position received after the reading", () => {
    expect(withPosition(start, at(0)).route.trail).toEqual([
      [4, 43],
      [5, 43],
    ]);
  });

  it("keeps one point every 15 s of flight time, like the API", () => {
    let followed = withPosition(start, at(0));
    followed = withPosition(followed, at(2, 5.1));
    followed = withPosition(followed, at(14, 5.2));
    expect(followed.route.trail).toHaveLength(2);
    followed = withPosition(followed, at(15, 5.3));
    expect(followed.route.trail.at(-1)).toEqual([5.3, 43]);
  });
});
