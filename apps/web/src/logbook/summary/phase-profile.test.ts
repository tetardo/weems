import type { FlightPhase } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { phaseProfile } from "./phase-profile.ts";

const point = (minute: number, altMsl: number, phase: FlightPhase | null) => ({
  at: new Date(Date.UTC(2026, 10, 12, 18, minute)).toISOString(),
  lat: 0,
  lon: 0,
  altMsl,
  altAgl: altMsl,
  ias: 0,
  gs: 0,
  vs: 0,
  heading: 0,
  onGround: altMsl === 0,
  phase,
});
const BOX = { width: 100, height: 50 };

describe("phaseProfile", () => {
  it("needs two points", () => {
    expect(phaseProfile([point(0, 0, "TAXI_OUT")], BOX)).toBeNull();
  });

  it("groups the phases into stages with their duration and width", () => {
    const profile = phaseProfile(
      [
        point(0, 0, "TAXI_OUT"),
        point(10, 0, "TAKEOFF"),
        point(20, 10000, "CLIMB"),
        point(60, 10000, "CRUISE"),
        point(80, 2000, "DESCENT"),
        point(90, 0, "FINAL"),
        point(100, 0, "TAXI_IN"),
      ],
      BOX,
    );
    expect(profile?.spans.map((s) => [s.stage, s.durationS / 60])).toEqual([
      ["ground", 10],
      ["climb", 50],
      ["cruise", 20],
      ["descent", 10],
      ["approach", 10],
    ]);
    expect(profile?.spans[2]).toMatchObject({ x: 60, width: 20 });
    expect(profile?.top).toMatchObject({ altFt: 10000, x: 20 });
  });
});
