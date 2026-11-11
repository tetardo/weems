import { describe, expect, it } from "vitest";
import { eventValues, logEntries } from "./event-log.ts";
import { landingSummary } from "./landing-summary.ts";
import { PHASE_COLORS } from "./phase-colors.ts";
import { phaseTimeline } from "./phase-timeline.ts";
import { nearestIndex, profileGeometry } from "./profile-geometry.ts";
import { event, phase, point } from "./testing/flight-fixture.ts";
import { bounds, endpoints, phaseLines } from "./track-geojson.ts";

describe("phase timeline", () => {
  it("gives each phase its start and its duration until the next one", () => {
    const events = [
      phase(0, "BOARDING"),
      event(1, "paused"),
      phase(5, "TAXI_OUT"),
      phase(12, "TAKEOFF"),
    ];
    expect(phaseTimeline(events, "2026-11-11T08:13:00.000Z")).toEqual([
      { phase: "BOARDING", startAt: "2026-11-11T08:00:00.000Z", durationS: 300 },
      { phase: "TAXI_OUT", startAt: "2026-11-11T08:05:00.000Z", durationS: 420 },
      { phase: "TAKEOFF", startAt: "2026-11-11T08:12:00.000Z", durationS: 60 },
    ]);
  });

  it("leaves the duration unknown while the flight is open, and ARRIVED without duration", () => {
    expect(phaseTimeline([phase(0, "CRUISE")], null)[0]?.durationS).toBeNull();
    expect(phaseTimeline([phase(0, "ARRIVED")], "2026-11-11T09:00:00.000Z")[0]?.durationS).toBe(0);
  });
});

describe("landing summary", () => {
  it("keeps the final landing after a go-around, and counts its bounces", () => {
    const events = [
      event(50, "touchdown", { vs: -900 }),
      event(51, "goAround"),
      event(60, "touchdown", { vs: -180.4 }),
      event(60, "bounce"),
      event(61, "touchdown", { vs: -60 }),
    ];
    expect(landingSummary(events)).toEqual({
      touchdownVs: -180.4,
      bounces: 1,
      touchdowns: 3,
      goArounds: 1,
    });
  });

  it("is null without touchdown, and the rate unknown when not measured", () => {
    expect(landingSummary([event(1, "paused")])).toBeNull();
    expect(landingSummary([event(1, "touchdown")])?.touchdownVs).toBeNull();
  });
});

describe("event log", () => {
  it("leaves phase changes to the timeline", () => {
    expect(logEntries([phase(0, "CLIMB"), event(1, "paused")]).map((e) => e.type)).toEqual([
      "paused",
    ]);
  });

  it("gives the values of the translated sentences", () => {
    expect(eventValues(event(0, "touchdown", { vs: -152.6 }))).toEqual({ vs: -153 });
    expect(eventValues(event(0, "simRateChanged", { from: 1, to: 4 }))).toEqual({ rate: 4 });
    expect(eventValues(event(0, "slew", { active: true }))).toEqual({ state: "on" });
  });
});

describe("track on the map", () => {
  const points = [
    point(0, "TAXI_OUT"),
    point(1, "TAXI_OUT"),
    point(2, "TAKEOFF"),
    point(3, "CLIMB", 900),
  ];

  it("draws one line per phase, joined at the boundaries", () => {
    const lines = phaseLines(points).features;
    expect(lines.map((f) => f.properties?.["phase"])).toEqual(["TAXI_OUT", "TAKEOFF"]);
    expect(lines[0]?.geometry.coordinates).toHaveLength(3);
    expect(lines[1]?.geometry.coordinates.at(0)).toEqual(lines[0]?.geometry.coordinates.at(-1));
    expect(lines[0]?.properties?.["color"]).toBe(PHASE_COLORS.TAXI_OUT);
  });

  it("marks departure and arrival, and frames the track", () => {
    expect(endpoints(points).features.map((f) => f.properties?.["kind"])).toEqual([
      "departure",
      "arrival",
    ]);
    expect(bounds(points)).toEqual([
      [1, 45],
      [1.03, 45.03],
    ]);
    expect(bounds([])).toBeNull();
  });
});

describe("vertical profile", () => {
  const points = [
    point(0, "TAKEOFF", 0, 0),
    point(10, "CLIMB", 10_500, 280),
    point(20, "CRUISE", 36_000, 450),
  ];

  it("scales time on x and altitude on y, with rounded maxima", () => {
    const profile = profileGeometry(points, { width: 200, height: 100 });
    expect(profile?.xs).toEqual([0, 100, 200]);
    expect(profile?.maxAltitude).toBe(36_000);
    expect(profile?.maxSpeed).toBe(450);
    expect(profile?.altitudePath.startsWith("M0.0,100.0")).toBe(true);
    expect(profile?.bands.map((b) => [b.phase, b.x, b.width])).toEqual([
      ["TAKEOFF", 0, 100],
      ["CLIMB", 100, 100],
      ["CRUISE", 200, 0],
    ]);
  });

  it("finds the point under the pointer", () => {
    expect(nearestIndex([0, 100, 200], 140)).toBe(1);
    expect(nearestIndex([0, 100, 200], 160)).toBe(2);
  });

  it("needs at least two points", () => {
    expect(profileGeometry([point(0, null)], { width: 10, height: 10 })).toBeNull();
  });
});
