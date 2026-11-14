import type { BandMinute, FlightBands } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { ecamCell, ecamValue, grouped, unmeasuredRows } from "./ecam-values.ts";

const minute = (values: Partial<BandMinute["values"]>): BandMinute => ({
  at: "2026-11-14T05:16:00Z",
  phase: "CLIMB",
  values: values as BandMinute["values"],
});

const bands = (minutes: BandMinute[], extra: Partial<FlightBands> = {}): FlightBands => ({
  minutes,
  rows: ["altitude", "flaps"],
  marks: null,
  unmeasured: null,
  fuelUsedKg: null,
  distanceNm: 0,
  ...extra,
});

describe("ecam values", () => {
  it("groups thousands with a space and keeps the sign", () => {
    expect(grouped(21734)).toBe("21 734");
    expect(grouped(-1063)).toBe("-1 063");
    expect(grouped(-0.2)).toBe("0");
  });

  it("writes values as a cockpit display", () => {
    expect(ecamValue("altitude", 21734)).toEqual({ text: "21 730", unit: "FT", tone: "green" });
    expect(ecamValue("verticalSpeed", 2498)).toEqual({
      text: "+2 500",
      unit: "FT/MN",
      tone: "green",
    });
    expect(ecamValue("verticalSpeed", -1063).text).toBe("-1 060");
    expect(ecamValue("gear", 0)).toEqual({ text: "UP", unit: "", tone: "white" });
    expect(ecamValue("gear", 1).text).toBe("DN");
    expect(ecamValue("spoilers", 0).text).toBe("RET");
    expect(ecamValue("beacon", 1)).toEqual({ text: "ON", unit: "", tone: "green" });
    expect(ecamValue("strobe", 0).text).toBe("OFF");
    expect(ecamValue("landingLight", 0.4)).toEqual({ text: "40", unit: "%", tone: "green" });
    expect(ecamValue("gForce", 1).text).toBe("1.00");
  });

  it("boxes a setting that changed, gives a trend, and marks the stretches to review", () => {
    const b = bands([minute({ altitude: 1000, flaps: 2 }), minute({ altitude: 1800, flaps: 1 })], {
      marks: [{ row: "flaps", from: 1, to: 1, reason: "speed250" }],
    });
    const none = unmeasuredRows(null);
    expect(ecamCell(b, "flaps", 1, none)).toMatchObject({ changed: true, marked: true });
    expect(ecamCell(b, "altitude", 1, none)).toMatchObject({ changed: false, trend: "up" });
    expect(ecamCell(b, "altitude", 0, none).trend).toBeNull();
    expect(ecamCell(b, "gear", 1, none).value).toBeNull();
  });

  it("shows N/M for a value this aircraft does not give", () => {
    const rows = unmeasuredRows(["beaconOff", "cabinRate"]);
    expect([...rows]).toEqual(["beacon", "cabinAltitude", "cabinRate"]);
    expect(ecamCell(bands([minute({ beacon: 0 })]), "beacon", 0, rows).value).toBe("unmeasured");
  });
});
