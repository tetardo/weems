import type { FlightPhase, TrackPoint } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { trackPoint } from "../../testing/public-flights.ts";
import { flightBands, weatherOf } from "./bands.ts";

const START = Date.parse("2026-11-12T18:00:00.000Z");
const at = (seconds: number) => new Date(START + seconds * 1000).toISOString();
const point = (
  seconds: number,
  over: Partial<TrackPoint> = {},
  phase: FlightPhase | null = null,
) => ({
  ...trackPoint({ at: at(seconds), ...over }),
  phase,
});

describe("flight bands", () => {
  it("sums each minute up, row by row", () => {
    const bands = flightBands(
      [
        point(0, { altMsl: 1000, ias: 100, bank: -10, autopilot: false, fuelKg: 3000 }, "CLIMB"),
        point(30, { altMsl: 3000, ias: 140, bank: 25, autopilot: true, fuelKg: 2990 }, "CLIMB"),
        point(60, { altMsl: 4000, ias: 160, autopilot: true, fuelKg: 2950 }, "CRUISE"),
      ],
      false,
    );
    expect(bands.minutes).toHaveLength(2);
    expect(bands.minutes[0]).toMatchObject({
      at: at(0),
      phase: "CLIMB",
      values: { altitude: 3000, speed: 120, bank: 25, autopilot: 0.5, flaps: null },
    });
    expect(bands.minutes[1]?.phase).toBe("CRUISE");
    expect(bands.fuelUsedKg).toBe(50);
    expect(bands.marks).toBeNull();
    expect(bands.unmeasured).toBeNull();
  });

  it("keeps only the rows with a value: older flights have the trajectory only", () => {
    const bands = flightBands([point(0), point(20)], false);
    expect(bands.rows).toEqual(["altitude", "speed", "verticalSpeed"]);
    expect(bands.fuelUsedKg).toBeNull();
  });

  it("reads braking from the deceleration on the ground, across minutes", () => {
    const bands = flightBands(
      [
        point(0, { onGround: true, gs: 100 }),
        point(55, { onGround: true, gs: 100 }),
        point(65, { onGround: true, gs: 40 }),
      ],
      false,
    );
    expect(bands.minutes[1]?.values["braking"]).toBe(6);
  });

  it("marks the stretches to review, one mark per run of minutes", () => {
    const fast = { altMsl: 8000, ias: 280 };
    const bands = flightBands(
      [
        point(0, fast),
        point(60, fast),
        point(120, { altMsl: 12_000, ias: 280 }),
        point(180, { altAgl: 600, vs: -1400, bank: 35 }),
      ],
      true,
    );
    expect(bands.marks).toEqual([
      { row: "speed", from: 0, to: 1, reason: "speed250" },
      { row: "bank", from: 3, to: 3, reason: "bank30" },
      { row: "verticalSpeed", from: 3, to: 3, reason: "sinkRate" },
    ]);
  });
});

describe("weather of a minute", () => {
  const windy = (dir: number, speed: number, oat = 15) =>
    ({
      ...trackPoint({ at: at(0) }),
      phase: null,
      wind: { dir, speed },
      oat,
      visibilityM: 9000,
    }) as Parameters<typeof weatherOf>[0][number];

  it("averages wind directions as vectors, speeds, temperature and visibility as plain means", () => {
    expect(weatherOf([windy(350, 20, 14), windy(10, 30, 15)])).toEqual({
      wind: { dir: 0, speed: 25 },
      oat: 15,
      visibilityM: 9000,
    });
    expect(weatherOf([windy(260, 30), windy(280, 40)]).wind).toEqual({ dir: 270, speed: 35 });
  });

  it("gives nulls when nothing was recorded (older flights)", () => {
    expect(weatherOf([{ ...trackPoint({ at: at(0) }), phase: null }])).toEqual({
      wind: null,
      oat: null,
      visibilityM: null,
    });
  });
});
