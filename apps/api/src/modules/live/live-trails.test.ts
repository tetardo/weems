import type { PositionReport } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { LiveTrails } from "./live-trails.ts";

const ID = "0197a000-0000-7000-8000-000000000001";
const START = Date.parse("2026-11-11T08:00:00.000Z");

const at = (seconds: number, lon = seconds / 100): PositionReport => ({
  seq: seconds,
  at: new Date(START + seconds * 1_000).toISOString(),
  lat: 45,
  lon,
  altMsl: 30000,
  gs: 400,
  heading: 90,
  vs: 0,
  phase: "CRUISE",
  onGround: false,
});

describe("live trails", () => {
  it("keeps one point every 15 s of flight time", () => {
    const trails = new LiveTrails();
    [0, 2, 10, 15, 16, 31].forEach((s) => trails.add(ID, at(s)));
    expect(trails.of(ID)).toEqual([
      [0, 45],
      [0.15, 45],
      [0.31, 45],
    ]);
  });

  it("halves the points past 1 500, keeping the first and the newest", () => {
    const trails = new LiveTrails();
    for (let i = 0; i <= 1_500; i += 1) trails.add(ID, at(i * 15, i));
    const points = trails.of(ID);
    expect(points).toHaveLength(751);
    expect(points[0]).toEqual([0, 45]);
    expect(points.at(-1)).toEqual([1_500, 45]);
  });

  it("keeps altitude, speeds and phase of each point for the page of a flight in progress", () => {
    const trails = new LiveTrails();
    trails.add(ID, { ...at(0), altMsl: 1_200, gs: 140, vs: 1_800, phase: "CLIMB" });
    trails.add(ID, at(15));
    expect(trails.pointsOf(ID)).toEqual([
      { at: at(0).at, lat: 45, lon: 0, altMsl: 1_200, gs: 140, vs: 1_800, phase: "CLIMB" },
      { at: at(15).at, lat: 45, lon: 0.15, altMsl: 30_000, gs: 400, vs: 0, phase: "CRUISE" },
    ]);
  });

  it("forgets a flight, and gives an empty trail for an unknown one", () => {
    const trails = new LiveTrails();
    trails.add(ID, at(0));
    trails.forget(ID);
    expect(trails.of(ID)).toEqual([]);
    expect(trails.pointsOf(ID)).toEqual([]);
  });
});
