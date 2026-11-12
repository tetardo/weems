import { describe, expect, it } from "vitest";
import { flightLevel, formatDuration, formatRoute, utcTime } from "./flight-format.ts";

describe("flight formats", () => {
  it("writes durations as h:mm, rounded to the minute", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(3_929)).toBe("1:05");
    expect(formatDuration(7_200)).toBe("2:00");
    expect(formatDuration(null)).toBeNull();
  });

  it("writes a route with dashes for unknown airports", () => {
    expect(formatRoute("LFPG", null)).toBe("LFPG → —");
  });

  it("keeps the UTC time of a timestamp", () => {
    expect(utcTime("2026-11-11T08:06:38.000Z")).toBe("08:06:38");
  });

  it("reads a level in hundreds of feet from 10 000 ft, else leaves feet to the caller", () => {
    expect(flightLevel(30_020)).toBe("FL300");
    expect(flightLevel(10_000)).toBe("FL100");
    expect(flightLevel(9_999)).toBeNull();
  });
});
