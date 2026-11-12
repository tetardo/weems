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

describe("band values of a point", () => {
  const at = "2026-11-12T08:00:00.000Z";
  const engine = (running: boolean, n1: number | null) => ({ running, n1 });

  it("keeps what the flight bands draw", () => {
    const p = toTrackPoint(sample({ fuelKg: 2900, flapsIndex: 2, autopilot: true }), at);
    expect(p).toMatchObject({ fuelKg: 2900, flapsIndex: 2, autopilot: true });
  });

  it("averages the N1 of the running engines, 0 when all are stopped", () => {
    const n1 = (engines: { running: boolean; n1: number | null }[]) =>
      toTrackPoint(sample({ engines }), at).n1;
    expect(n1([engine(true, 80), engine(true, 90), engine(false, 20)])).toBe(85);
    expect(n1([engine(false, null), engine(false, null)])).toBe(0);
    expect(n1([engine(true, null)])).toBeNull();
  });
});
