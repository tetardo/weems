import { describe, expect, it } from "vitest";
import { sample } from "../core/testing/sample.ts";
import { thinTrack, toTrackPoint } from "./track-points.ts";

const point = (ms: number, onGround = false) =>
  toTrackPoint(sample({ onGround }), new Date(Date.UTC(2026, 10, 11, 8) + ms).toISOString());

describe("trajectory points", () => {
  it("keeps one point per second, every ground change and the last point", () => {
    const points = [0, 300, 600, 900, 1200, 1500].map((ms) => point(ms, ms < 600));
    expect(thinTrack(points).map((p) => p.at.slice(17, 23))).toEqual([
      "00.000",
      "00.600",
      "01.500",
    ]);
  });
});
