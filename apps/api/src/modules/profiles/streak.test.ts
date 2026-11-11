import { describe, expect, it } from "vitest";
import { weeklyStreak } from "./streak.ts";

// Friday 20 November 2026; weeks start on Monday 16, 9, 2 November and 26 October.
const NOW = new Date("2026-11-20T12:00:00.000Z");
const days = (...dates: string[]) => dates.map((d) => new Date(`${d}T10:00:00.000Z`));

describe("weekly streak", () => {
  it("counts this week and the weeks before without a gap", () => {
    expect(weeklyStreak(days("2026-11-16", "2026-11-15", "2026-10-26"), NOW)).toEqual({
      currentWeeks: 2,
      recordWeeks: 2,
    });
  });

  it("still counts from last week while this week has no flight yet", () => {
    expect(weeklyStreak(days("2026-11-15", "2026-11-09"), NOW).currentWeeks).toBe(1);
  });

  it("drops to zero after a week without flight, and keeps the record", () => {
    const streak = weeklyStreak(days("2026-11-02", "2026-10-26", "2026-10-19", "2026-10-12"), NOW);
    expect(streak).toEqual({ currentWeeks: 0, recordWeeks: 4 });
  });

  it("is empty without flights", () => {
    expect(weeklyStreak([], NOW)).toEqual({ currentWeeks: 0, recordWeeks: 0 });
  });
});
