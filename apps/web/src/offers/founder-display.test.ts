import { describe, expect, it } from "vitest";
import { daysUntil, meterSegments, showPlacesLeft } from "./founder-display.ts";

describe("founder offer display", () => {
  it("tells the places left only below 100", () => {
    expect(showPlacesLeft(463)).toBe(false);
    expect(showPlacesLeft(99)).toBe(true);
    expect(showPlacesLeft(0)).toBe(false);
  });

  it("counts whole days left", () => {
    const now = Date.parse("2026-11-13T10:00:00.000Z");
    expect(daysUntil("2027-11-13T10:00:00.000Z", now)).toBe(365);
    expect(daysUntil("2026-11-01T00:00:00.000Z", now)).toBe(0);
  });

  it("fills one segment per valid flight", () => {
    expect(meterSegments(2)).toEqual([true, true, false]);
    expect(meterSegments(5)).toEqual([true, true, true]);
  });
});
