import { describe, expect, it } from "vitest";
import { ago, daysLeft, elapsed } from "./time.ts";

const NOW = Date.parse("2026-11-11T20:00:00Z");
const before = (ms: number) => new Date(NOW - ms).toISOString();

describe("time", () => {
  it("writes durations", () => {
    expect(elapsed(45_000)).toBe("45 s");
    expect(elapsed(252_000)).toBe("4 min 12 s");
    expect(elapsed((2 * 60 + 14) * 60_000)).toBe("2 h 14");
  });

  it("writes how long ago", () => {
    expect(ago(before(10_000), NOW)).toBe("à l'instant");
    expect(ago(before(12 * 60_000), NOW)).toBe("il y a 12 min");
    expect(ago(before(2 * 3_600_000), NOW)).toBe("il y a 2 h");
    expect(ago(before(30 * 3_600_000), NOW)).toBe("hier");
    expect(ago(before(5 * 86_400_000), NOW)).toBe("il y a 5 j");
  });

  it("counts the days left of an invitation", () => {
    expect(daysLeft(new Date(NOW + 13.2 * 86_400_000).toISOString(), NOW)).toBe(14);
    expect(daysLeft(before(1000), NOW)).toBe(0);
  });
});
