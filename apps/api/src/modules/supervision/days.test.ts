import { describe, expect, it } from "vitest";
import { fillDays, lastParisDays } from "./days.ts";

describe("lastParisDays", () => {
  it("ends with today in Paris, even when it is still yesterday in UTC", () => {
    // 23:30 UTC on 11/11 is 00:30 on 12/11 in Paris (UTC+1).
    expect(lastParisDays(new Date("2026-11-11T23:30:00.000Z"), 3)).toEqual([
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
    ]);
  });

  it("crosses a month", () => {
    expect(lastParisDays(new Date("2026-12-01T12:00:00.000Z"), 2)).toEqual([
      "2026-11-30",
      "2026-12-01",
    ]);
  });
});

describe("fillDays", () => {
  it("puts zeros where the database returned nothing", () => {
    const days = ["2026-11-10", "2026-11-11", "2026-11-12"];
    const rows = [{ date: "2026-11-11", n: 4 }];
    expect(fillDays(days, rows, (date) => ({ date, n: 0 }))).toEqual([
      { date: "2026-11-10", n: 0 },
      { date: "2026-11-11", n: 4 },
      { date: "2026-11-12", n: 0 },
    ]);
  });
});
