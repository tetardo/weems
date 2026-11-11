import { describe, expect, it } from "vitest";
import { FLEET, fleetOf } from "./fleet.ts";

describe("fleetOf", () => {
  it("starts with the 10 J1 routes", () => {
    expect(fleetOf(10)).toEqual(FLEET);
  });

  it("gives the same fleet for the same count", () => {
    expect(fleetOf(200)).toEqual(fleetOf(200));
  });

  it("gives every pilot its own callsign and a route between two different airports", () => {
    const fleet = fleetOf(500);
    expect(new Set(fleet.map((s) => s.callsign)).size).toBe(500);
    expect(fleet.every((s) => s.departure.icao !== s.arrival.icao)).toBe(true);
    expect(fleet.every((s) => s.callsign.length <= 10)).toBe(true);
  });
});
