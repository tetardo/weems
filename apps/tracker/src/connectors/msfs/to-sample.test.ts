import { describe, expect, it } from "vitest";
import { generateFlight } from "../../../tools/generate-flights/generator.ts";
import { LFPG_LFBO } from "../../../tools/generate-flights/scenario.ts";
import { rawA320, rawCruise, rawFromSample } from "./raw-sample-fixture.ts";
import { toAircraft, toSample } from "./to-sample.ts";

const context = { t: 1234.4, paused: false, engineCount: 2 };

describe("raw SimConnect sample to core sample (spec T0, part A)", () => {
  it("converts units and signs", () => {
    const sample = toSample(rawCruise(), context);
    expect(sample).toMatchObject({
      t: 1234,
      lat: 45.5,
      lon: 1.25,
      vs: -300,
      pitch: 2.5,
      bank: -10,
      heading: 190,
      fuelKg: 12_000 * 0.45359237,
      accel: { vertical: 1 },
      seatbelts: true,
      pushback: false,
      surface: { type: "asphalt", condition: "normal" },
      simTimeUtc: null,
      simRate: null,
    });
    expect(sample?.lat).toBeCloseTo(45.5, 10);
  });

  it("keeps only the aircraft's engines", () => {
    expect(toSample(rawCruise(), context)?.engines).toEqual([
      { running: true, n1: 85 },
      { running: true, n1: 85.5 },
    ]);
  });

  it("reports N1 as unknown when it reads 0 (piston engine)", () => {
    const raw = rawCruise();
    raw.engines = raw.engines.map((e) => ({ ...e, n1: 0 }));
    expect(toSample(raw, context)?.engines[0]).toEqual({ running: true, n1: null });
  });

  it("turns aberrant optional values into null, never 0 (pieges.md)", () => {
    const sample = toSample(rawCruise({ fuelLb: -999_999, cabinAlt: -999_999 }), context);
    expect(sample?.fuelKg).toBeNull();
    expect(sample?.cabinAlt).toBeNull();
  });

  it("drops a sample whose position is aberrant", () => {
    expect(toSample(rawCruise({ lat: -999_999 }), context)).toBeNull();
  });

  it("normalises the heading into 0-360", () => {
    expect(toSample(rawCruise({ heading: 360 }), context)?.heading).toBe(0);
    expect(toSample(rawCruise({ heading: -10 }), context)?.heading).toBe(350);
  });

  it("detects a pushback in progress and an invalid surface condition", () => {
    const sample = toSample(rawCruise({ pushbackState: 0, surfaceValid: 0 }), context);
    expect(sample?.pushback).toBe(true);
    expect(sample?.surface).toEqual({ type: "asphalt", condition: null });
  });

  it("carries the pause state given by the connector", () => {
    expect(toSample(rawCruise(), { ...context, paused: true })?.paused).toBe(true);
  });
});

describe("raw aircraft identity", () => {
  it("keeps empty strings as unknown and converts the weight", () => {
    expect(toAircraft(rawA320(), "msfs2024")).toEqual({
      simulator: "msfs2024",
      title: "Airbus A320neo Weems",
      model: "A320",
      registration: null,
      engineCount: 2,
      emptyWeightKg: 93_000 * 0.45359237,
    });
  });

  it("ignores an aircraft without a title (still loading)", () => {
    expect(toAircraft(rawA320("  "), "msfs2020")).toBeNull();
  });
});

describe("round trip through raw SimConnect values", () => {
  it("gives back every sample of a synthetic flight", () => {
    const flight = generateFlight(LFPG_LFBO);
    const aircraft = flight.records.find((r) => r.type === "aircraft")?.data;
    const engineCount = aircraft?.engineCount ?? 0;
    for (const record of flight.records) {
      if (record.type !== "sample") continue;
      const s = record.data;
      const back = toSample(rawFromSample(s), { t: s.t, paused: s.paused, engineCount });
      expect(back).toEqual({
        ...s,
        simTimeUtc: null,
        simRate: null,
        lat: expect.closeTo(s.lat, 9),
        lon: expect.closeTo(s.lon, 9),
        fuelKg: s.fuelKg === null ? null : expect.closeTo(s.fuelKg, 6),
        weightKg: s.weightKg === null ? null : expect.closeTo(s.weightKg, 6),
        accel: {
          lateral: expect.closeTo(s.accel.lateral, 9),
          vertical: expect.closeTo(s.accel.vertical, 9),
          longitudinal: expect.closeTo(s.accel.longitudinal, 9),
        },
        vs: expect.closeTo(s.vs, 9),
        engines: s.engines.map((e) => ({ running: e.running, n1: e.n1 === 0 ? null : e.n1 })),
      });
    }
  });
});
