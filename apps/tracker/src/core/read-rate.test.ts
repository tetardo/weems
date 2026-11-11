import type { Sample } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { readRateFor } from "./read-rate.ts";

const at = (onGround: boolean, altAgl: number) => ({ onGround, altAgl }) as Sample;

describe("read rate (EF-09)", () => {
  it("reads every frame during the takeoff roll and the landing", () => {
    expect(readRateFor(at(true, 0), "TAKEOFF")).toBe("high");
    expect(readRateFor(at(true, 0), "LANDING")).toBe("high");
  });

  it("reads every frame below 1 000 ft in flight, whatever the phase", () => {
    expect(readRateFor(at(false, 400), "CLIMB")).toBe("high");
    expect(readRateFor(at(false, 999), "FINAL")).toBe("high");
    expect(readRateFor(at(false, 400), null)).toBe("high"); // loaded in the air
  });

  it("reads once per second at the gate, while taxiing and higher up", () => {
    expect(readRateFor(at(true, 0), "BOARDING")).toBe("normal");
    expect(readRateFor(at(true, 0), "TAXI_OUT")).toBe("normal");
    expect(readRateFor(at(false, 1_000), "CLIMB")).toBe("normal");
    expect(readRateFor(at(false, 35_000), "CRUISE")).toBe("normal");
  });
});
