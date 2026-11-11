import { describe, expect, it } from "vitest";
import { syntheticTrack } from "../../testing/synthetic-track.ts";
import { simplifyTrack } from "./simplify.ts";

describe("trajectory simplification", () => {
  it("keeps short trajectories as they are", () => {
    const track = syntheticTrack(100);
    expect(simplifyTrack(track, 500)).toEqual(track);
  });

  it("reduces a 2-hour flight to at most 500 points, ends and ground changes kept", () => {
    const track = syntheticTrack(7_200);
    const simplified = simplifyTrack(track, 500, [3_000]);
    expect(simplified.length).toBeLessThanOrEqual(500);
    expect(simplified.length).toBeGreaterThan(50);
    expect(simplified[0]).toBe(track[0]);
    expect(simplified.at(-1)).toBe(track.at(-1));
    expect(simplified).toContain(track[3_000]);
    const liftoff = track.findIndex((p) => !p.onGround);
    expect(simplified).toContain(track[liftoff]);
    expect(simplified).toContain(track[liftoff - 1]);
  });

  it("draws the profile within 200 ft of the original", () => {
    const track = syntheticTrack(7_200);
    const simplified = simplifyTrack(track, 500);
    const times = simplified.map((p) => Date.parse(p.at));
    for (const point of track.filter((_, i) => i % 97 === 0)) {
      const t = Date.parse(point.at);
      const next = times.findIndex((s) => s >= t);
      const [a, b] = [simplified[Math.max(0, next - 1)], simplified[next]];
      if (!a || !b || a === b) continue;
      const k = (t - Date.parse(a.at)) / (Date.parse(b.at) - Date.parse(a.at));
      expect(Math.abs(a.altMsl + k * (b.altMsl - a.altMsl) - point.altMsl)).toBeLessThan(200);
    }
  });
});
