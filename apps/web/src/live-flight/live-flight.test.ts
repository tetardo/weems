import type { FlightEvent, FlightPhase, LiveTrailPoint, PositionReport } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { pitchOf } from "./attitude.ts";
import { formatCoordinates } from "./coordinates.ts";
import { liveBands } from "./live-bands.ts";
import { mapDetail, phaseMarkers } from "./map-detail.ts";
import { withPosition } from "./live-trail.ts";
import { phaseSteps } from "./phase-steps.ts";

const START = Date.parse("2026-11-13T08:00:00.000Z");
const at = (seconds: number) => new Date(START + seconds * 1_000).toISOString();

const point = (seconds: number, altMsl: number, gs = 400, vs = 0): LiveTrailPoint => ({
  at: at(seconds),
  lat: 45,
  lon: 5,
  altMsl,
  gs,
  vs,
  phase: "CRUISE",
});

const position = (seconds: number): PositionReport => ({
  ...point(seconds, 36_000),
  seq: seconds,
  heading: 102,
  onGround: false,
});

describe("trail of a flight in progress", () => {
  it("grows from the stream by one point every 15 s of flight time", () => {
    const start = [point(0, 30_000)];
    expect(withPosition(start, position(10))).toBe(start);
    expect(withPosition(start, position(15))).toEqual([
      point(0, 30_000),
      { ...point(15, 36_000), phase: "CRUISE" },
    ]);
  });

  it("starts from the first position when the API had none", () => {
    expect(withPosition([], position(0))).toHaveLength(1);
  });
});

describe("nose angle on the progress bar", () => {
  it("climbs, levels and descends with the vertical speed, 20° at most", () => {
    expect(pitchOf(1_200)).toBe(12);
    expect(pitchOf(4_000)).toBe(20);
    expect(pitchOf(30)).toBe(0);
    expect(pitchOf(-30)).toBe(0);
    expect(pitchOf(-2_500)).toBe(-20);
  });
});

describe("bands of a flight in progress", () => {
  it("has one column per minute, highest altitude and mean speeds", () => {
    const bands = liveBands(
      [point(0, 1_000, 140, 1_500), point(30, 2_000, 160, 2_500), point(75, 4_000, 200, 2_000)],
      null,
    );
    expect(bands.rows).toEqual(["altitude", "speed", "verticalSpeed"]);
    expect(bands.marks).toBeNull();
    expect(bands.minutes).toHaveLength(2);
    expect(bands.minutes[0]).toMatchObject({
      at: at(0),
      phase: "CRUISE",
      values: { altitude: 2_000, speed: 150, verticalSpeed: 2_000, bank: null },
    });
    expect(bands.minutes[1]?.at).toBe(at(60));
  });

  it("adds empty columns up to the estimated arrival and leaves gaps empty", () => {
    const bands = liveBands([point(0, 1_000), point(150, 3_000)], START + 5 * 60_000);
    expect(bands.minutes).toHaveLength(5);
    expect(bands.minutes[1]).toMatchObject({ at: at(60), phase: null, values: { altitude: null } });
    expect(bands.minutes[4]).toMatchObject({ at: at(240), phase: null });
  });

  it("is empty before the first point", () => {
    expect(liveBands([], START).minutes).toEqual([]);
  });
});

describe("coordinates of the aircraft", () => {
  it("reads degrees and decimal minutes, hemispheres and the language's separator", () => {
    expect(formatCoordinates(43.97, 5.6917, ",")).toBe("43°58,2′ N · 005°41,5′ E");
    expect(formatCoordinates(-33.9461, -151.1772, ".")).toBe("33°56.8′ S · 151°10.6′ W");
    expect(formatCoordinates(48.99999, 2.0, ".")).toBe("49°00.0′ N · 002°00.0′ E");
  });
});

describe("map of a flight in progress", () => {
  const climb = (seconds: number, phase: LiveTrailPoint["phase"]) => ({
    ...point(seconds, seconds * 10),
    lon: 5 + seconds / 1_000,
    phase,
  });
  const points = [
    climb(0, "TAXI_OUT"),
    climb(15, "TAKEOFF"),
    climb(30, "CLIMB"),
    climb(45, "CRUISE"),
    climb(60, "CLIMB"),
    climb(75, "CRUISE"),
    climb(90, "DESCENT"),
  ];

  it("marks take-off, top of climb and top of descent once each", () => {
    expect(phaseMarkers(points).map((m) => [m.kind, m.at])).toEqual([
      ["takeoff", at(15)],
      ["topOfClimb", at(45)],
      ["topOfDescent", at(90)],
    ]);
  });

  it("draws the trail by altitude, the direct route, the speed vector and the markers", () => {
    const airport = (icao: string, lon: number) => ({ icao, name: icao, lat: 45, lon });
    const detail = mapDetail(
      points,
      position(90),
      { departure: airport("LFPG", 2), arrival: airport("LFMN", 7) },
      (m) => m.kind,
    );
    const kinds = detail.features.map((f) => f.properties?.["kind"]);
    expect(kinds.filter((k) => k === "trail")).toHaveLength(6);
    expect(detail.features[0]?.properties).toEqual({ kind: "trail", alt: 0 });
    expect(kinds).toContain("direct");
    expect(kinds).toContain("vector");
    const labels = detail.features.filter((f) => f.properties?.["kind"] === "marker");
    expect(labels.map((f) => f.properties?.["label"])).toEqual([
      "takeoff",
      "topOfClimb",
      "topOfDescent",
    ]);
  });

  it("has no speed vector on the ground, and no direct route without both airports", () => {
    const parked = { ...position(0), onGround: true };
    const detail = mapDetail([], parked, { departure: null, arrival: null }, () => "");
    expect(detail.features).toEqual([]);
  });
});

describe("phases of a flight in progress", () => {
  const change = (seq: number, from: FlightPhase | null, to: FlightPhase): FlightEvent => ({
    seq,
    at: at(seq * 60),
    type: "phaseChanged",
    context: { from, to },
  });
  const events = [
    change(1, null, "BOARDING"),
    change(2, "BOARDING", "TAXI_OUT"),
    change(3, "TAXI_OUT", "TAKEOFF"),
    change(4, "TAKEOFF", "CLIMB"),
    change(5, "CLIMB", "CRUISE"),
  ];

  it("lists the phases flown, the current one with its start, then those left", () => {
    const steps = phaseSteps(events, "CRUISE");
    expect(steps.map((s) => [s.phase, s.state])).toEqual([
      ["BOARDING", "done"],
      ["TAXI_OUT", "done"],
      ["TAKEOFF", "done"],
      ["CLIMB", "done"],
      ["CRUISE", "now"],
      ["DESCENT", "next"],
      ["APPROACH", "next"],
      ["FINAL", "next"],
      ["LANDING", "next"],
      ["TAXI_IN", "next"],
    ]);
    expect(steps[4]?.startAt).toBe(at(300));
  });

  it("shows the phase of the position even before its event is read again", () => {
    const steps = phaseSteps(events, "DESCENT");
    expect(steps.find((s) => s.state === "now")).toEqual({
      phase: "DESCENT",
      startAt: null,
      state: "now",
    });
    expect(steps.filter((s) => s.state === "done")).toHaveLength(5);
  });
});
