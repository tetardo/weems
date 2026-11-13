import { describe, expect, it } from "vitest";
import { historyDays, historyStart, utcDay } from "./history.ts";

const now = new Date("2026-11-13T05:50:00Z");

describe("history of the page Base de données", () => {
  it("counts UTC days back", () => {
    expect(utcDay(now)).toBe("2026-11-13");
    expect(utcDay(now, 13)).toBe("2026-10-31");
    expect(historyStart(now)).toBe("2026-10-15");
  });

  it("gives 30 days, oldest first, with nulls and zeros where nothing was recorded", () => {
    const days = historyDays(
      now,
      [{ day: "2026-11-12", totalBytes: 900, tables: { flights: 100 } }],
      [{ day: "2026-11-13", real: 2, simulated: 5 }],
    );
    expect(days).toHaveLength(30);
    expect(days[0]).toEqual({
      date: "2026-10-15",
      totalBytes: null,
      tables: null,
      realFlights: 0,
      simulatedFlights: 0,
    });
    expect(days.at(-2)).toMatchObject({ date: "2026-11-12", totalBytes: 900, realFlights: 0 });
    expect(days.at(-1)).toMatchObject({
      date: "2026-11-13",
      totalBytes: null,
      simulatedFlights: 5,
    });
  });
});
