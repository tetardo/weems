import { describe, expect, it } from "vitest";
import { qualityOf, recorded } from "./data-quality.ts";

describe("data quality of a field over a flight", () => {
  it("is live when the value changes", () => {
    expect(qualityOf([false, null, true])).toBe("live");
    expect(qualityOf([0, 120, -300])).toBe("live");
  });

  it("is frozen when the value never moves", () => {
    expect(qualityOf([false, false, false])).toBe("frozen");
    expect(qualityOf([0, 0])).toBe("frozen");
  });

  it("is absent when the value is never known", () => {
    expect(qualityOf([null, undefined])).toBe("absent");
    expect(qualityOf([])).toBe("absent");
  });

  it("accepts a steady normal value (an alarm that never sounds), not a stuck one", () => {
    expect(qualityOf([false, false], false)).toBe("live");
    expect(qualityOf([true, true], false)).toBe("frozen");
  });

  it("tells a field never sent from a field the simulator leaves unknown", () => {
    expect(recorded([undefined, undefined])).toBe(false);
    expect(recorded([undefined, null])).toBe(true);
  });
});
