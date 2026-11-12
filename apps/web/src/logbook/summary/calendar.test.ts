import { describe, expect, it } from "vitest";
import { flyingCalendar } from "./calendar.ts";

const TODAY = new Date("2026-11-12T20:00:00.000Z"); // a Thursday

describe("flyingCalendar", () => {
  it("lays out whole weeks, Monday first, the last one holding today", () => {
    const days = flyingCalendar([], TODAY, 17);
    expect(days).toHaveLength(17 * 7);
    expect(days[0]).toMatchObject({ day: "2026-07-20", week: 0, weekday: 0 });
    expect(days.find((d) => d.day === "2026-11-12")).toMatchObject({ week: 16, weekday: 3 });
    expect(days.at(-1)?.day).toBe("2026-11-15");
  });

  it("shades a day by its flights and flying time", () => {
    const days = flyingCalendar(
      [
        { day: "2026-11-10", flights: 1, airborneS: 1800 },
        { day: "2026-11-11", flights: 2, airborneS: 1800 },
        { day: "2026-11-12", flights: 1, airborneS: 4 * 3600 },
      ],
      TODAY,
      2,
    );
    const level = (day: string) => days.find((d) => d.day === day)?.level;
    expect([
      level("2026-11-09"),
      level("2026-11-10"),
      level("2026-11-11"),
      level("2026-11-12"),
    ]).toEqual([0, 1, 2, 3]);
  });
});
