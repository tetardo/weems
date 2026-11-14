import type { BandMinute, FlightBands, FlightPhase } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { flightStatus } from "./flight-status.ts";

const m = (phase: FlightPhase, altitude: number, speed: number, bank: number | null) =>
  ({ at: "", phase, values: { altitude, speed, bank } }) as unknown as BandMinute;

const bands = (marks: FlightBands["marks"]): FlightBands => ({
  minutes: [
    m("TAXI_OUT", 0, 25, 0),
    m("CLIMB", 6000, 262, -18),
    m("CRUISE", 34000, 290, 3),
    m("APPROACH", 3000, 180, null),
  ],
  rows: ["altitude", "speed", "bank"],
  marks,
  unmeasured: null,
  fuelUsedKg: 1840,
  distanceNm: 168,
});

describe("flightStatus", () => {
  it("sums the flight up as the STATUS block shows it", () => {
    const status = flightStatus(
      { times: { blockS: 2700, airborneS: 2300, pausedS: 0 } },
      bands(null),
      {
        touchdownVs: -180,
        gForce: 1.18,
      },
    );
    expect(status).toEqual({
      blockS: 2700,
      distanceNm: 168,
      fuelKg: 1840,
      touchdownVs: -180,
      touchdownG: 1.18,
      bankMax: 18,
      iasLow: 262, // the taxi and the cruise do not count
      iasLowMarked: false,
    });
  });

  it("flags the low IAS when a 250 kt mark was raised, and survives a flight without landing", () => {
    const status = flightStatus(
      { times: { blockS: null, airborneS: null, pausedS: 0 } },
      bands([{ row: "speed", from: 1, to: 1, reason: "speed250" }]),
      null,
    );
    expect(status.iasLowMarked).toBe(true);
    expect(status.touchdownVs).toBeNull();
  });
});
