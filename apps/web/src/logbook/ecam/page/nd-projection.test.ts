import type { TrackView } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { ND_HEIGHT, ND_WIDTH, nearestProjected, projectTrack, ringStep } from "./nd-projection.ts";

const p = (lat: number, lon: number) => ({ lat, lon }) as TrackView["points"][number];

describe("ND projection", () => {
  it("puts the track inside the box, north up, west on the left", () => {
    const {
      at: [marseille = [0, 0], toulouse = [0, 0]],
    } = projectTrack([p(43.44, 5.22), p(43.63, 1.37)], []);
    expect(toulouse[0]).toBeLessThan(marseille[0]);
    expect(toulouse[1]).toBeLessThan(marseille[1]); // further north: higher
    for (const [x, y] of [marseille, toulouse]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(ND_WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(ND_HEIGHT);
    }
  });

  it("finds the nearest point within a radius", () => {
    const projected: [number, number][] = [
      [10, 10],
      [50, 10],
    ];
    expect(nearestProjected(projected, 45, 12, 20)).toBe(1);
    expect(nearestProjected(projected, 200, 200, 20)).toBeNull();
  });

  it("measures nautical miles and picks round ring distances", () => {
    const { pxPerNm } = projectTrack([p(43, 5), p(44, 5)], []); // 60 NM north-south
    expect(pxPerNm).toBeCloseTo((ND_HEIGHT - 68) / 60);
    expect(ringStep(pxPerNm)).toBe(50);
    expect(ringStep(80)).toBe(1);
  });
});
