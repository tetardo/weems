import type { FlightPhase, RecordedPoint } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { trackPoint } from "../../testing/public-flights.ts";
import { checkedRules, markReasons, marksOf, type MarkedPoint } from "./marks.ts";

const START = Date.parse("2026-11-14T08:00:00.000Z");
const LIGHTS = { beacon: true, landing: true, strobe: true, nav: true, taxi: false };

/** A point of a full recording (since 14/11/2026), every light on, no alarm, engine running. */
function full(
  seconds: number,
  over: Partial<RecordedPoint> = {},
  phase: FlightPhase | null = "CRUISE",
): MarkedPoint {
  return {
    ...trackPoint({ at: new Date(START + seconds * 1000).toISOString() }),
    altMsl: 20_000,
    altAgl: 20_000,
    landingLight: true,
    overspeed: false,
    stall: false,
    onRunway: false,
    engines: [{ running: true, n1: 80 }],
    cabinAlt: 6000,
    cabinRate: 0,
    phase,
    ...over,
    lights: { ...LIGHTS, ...over.lights },
  };
}

/** A short flight where the switches change at least once, so that they are live. */
const lively = (...more: MarkedPoint[]) => [
  full(0, {
    onGround: true,
    lights: { ...LIGHTS, beacon: false, strobe: false },
    engines: [{ running: false, n1: 0 }],
    landingLight: false,
    cabinRate: 100,
  }),
  full(5, { onGround: true, onRunway: true }),
  ...more,
];

const reasons = (points: MarkedPoint[]) => [...markReasons(points)].sort();

describe("marks of the bands", () => {
  it("flags an overspeed or stall warning in the air, never on the ground", () => {
    expect(reasons([full(0), full(1, { overspeed: true }), full(2, { stall: true })])).toEqual([
      "overspeedWarning",
      "stallWarning",
    ]);
    expect(reasons([full(0), full(1, { onGround: true, stall: true })])).toEqual([]);
  });

  it("flags the beacon off while an engine runs", () => {
    const points = lively(full(10, { lights: { ...LIGHTS, beacon: false } }));
    expect(markReasons(points)).toContain("beaconOff");
  });

  it("flags the strobes off on the runway", () => {
    const points = lively(
      full(10, { onGround: true, onRunway: true, lights: { ...LIGHTS, strobe: false } }),
    );
    expect(markReasons(points)).toContain("strobeOffRunway");
  });

  it("flags the landing light off in the air below 10,000 ft", () => {
    const low = full(10, { altMsl: 4000, altAgl: 3000, landingLight: false });
    expect(markReasons(lively(low))).toContain("landingLightLow");
    expect(markReasons(lively(full(20, { landingLight: false })))).not.toContain("landingLightLow");
  });

  it("flags taxiing faster than 30 kt, not the take-off roll", () => {
    const taxi = { onGround: true, ias: 35, gs: 35 };
    expect(markReasons(lively(full(10, taxi, "TAXI_OUT")))).toContain("taxiSpeed");
    expect(markReasons(lively(full(10, { ...taxi, onRunway: true }, "TAXI_OUT")))).not.toContain(
      "taxiSpeed",
    );
    expect(markReasons(lively(full(10, taxi, "TAKEOFF")))).not.toContain("taxiSpeed");
  });

  it("flags the cabin rate beyond comfort, on a pressurised aircraft only", () => {
    expect(markReasons(lively(full(10, { cabinRate: -450 })))).toContain("cabinRate");
    expect(markReasons(lively(full(10, { cabinRate: -250 })))).not.toContain("cabinRate");
    const unpressurised = (p: MarkedPoint) => ({ ...p, cabinAlt: p.altMsl });
    const ga = lively(full(10, { cabinRate: -700 })).map(unpressurised);
    expect(markReasons(ga)).not.toContain("cabinRate");
    expect(checkedRules(ga).unmeasured).not.toContain("cabinRate");
  });
});

describe("data quality of the marks", () => {
  it("never marks from a frozen value: « not measured on this aircraft »", () => {
    const dead = { ...LIGHTS, beacon: false, strobe: false };
    const points = [full(0, { lights: dead }), full(10, { lights: dead, onRunway: true })];
    expect(markReasons(points)).not.toContain("beaconOff");
    expect(checkedRules(points).unmeasured).toEqual(
      expect.arrayContaining(["beaconOff", "strobeOffRunway", "landingLightLow", "cabinRate"]),
    );
  });

  it("reads an alarm that never sounds as measured, a stuck one as not measured", () => {
    expect(checkedRules([full(0), full(1)]).unmeasured).not.toContain("stallWarning");
    const stuck = [full(0, { stall: true }), full(1, { stall: true })];
    expect(markReasons(stuck)).not.toContain("stallWarning");
    expect(checkedRules(stuck).unmeasured).toContain("stallWarning");
  });

  it("reads a value the simulator never gives as not measured", () => {
    const points = [full(0, { overspeed: null }), full(1, { overspeed: null })];
    expect(checkedRules(points).unmeasured).toContain("overspeedWarning");
  });

  it("says nothing of the new marks on flights recorded before the full points", () => {
    const old = [trackPoint(), trackPoint({ altMsl: 8000, ias: 280 })];
    expect(checkedRules(old).unmeasured).toEqual([]);
    expect(markReasons(old)).toEqual(new Set(["speed250"]));
  });
});

describe("marks by minute", () => {
  it("joins consecutive minutes and lists what could not be checked", () => {
    const alarm = { overspeed: true };
    const { marks, unmeasured } = marksOf([
      [full(0, alarm)],
      [full(60, alarm)],
      [full(120)],
      [full(180, alarm)],
    ]);
    expect(marks.filter((m) => m.reason === "overspeedWarning")).toEqual([
      { row: "speed", from: 0, to: 1, reason: "overspeedWarning" },
      { row: "speed", from: 3, to: 3, reason: "overspeedWarning" },
    ]);
    expect(unmeasured).toContain("beaconOff");
  });
});
