import type { DatabaseDay } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import {
  flightTotals,
  growthOf,
  largestShare,
  monthYear,
  projection,
  shortDay,
  tableSeries,
} from "./history.ts";

/** 30 days ending 2026-11-13, with a reading where `sizes` gives one (index from the oldest). */
function history(sizes: Record<number, Record<string, number>>): DatabaseDay[] {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(Date.UTC(2026, 10, 13 - 29 + i)).toISOString().slice(0, 10);
    const tables = sizes[i] ?? null;
    const total = tables ? Object.values(tables).reduce((a, b) => a + b, 0) : null;
    return { date, totalBytes: total, tables, realFlights: i % 3, simulatedFlights: 2 };
  });
}

describe("charts of the page Base de données", () => {
  it("measures growth against the reading of 7 days ago, or the oldest", () => {
    const days = history({ 10: { t: 10 }, 21: { t: 40 }, 25: { t: 70 }, 29: { t: 100 } });
    expect(growthOf(days)).toEqual({ since: "2026-11-05", totalBytes: 60, tables: { t: 60 } });
    const young = history({ 25: { t: 70 }, 29: { t: 100, u: 5 } });
    expect(growthOf(young)).toEqual({
      since: "2026-11-09",
      totalBytes: 35,
      tables: { t: 30, u: 5 },
    });
    expect(growthOf(history({ 29: { t: 1 } }))).toBeNull();
  });

  it("projects the day the disk is full, far away, or not at all", () => {
    const fast = projection(history({ 19: { t: 1e9 }, 29: { t: 2e9 } }));
    expect(fast).toEqual({ kind: "date", at: new Date("2027-05-12T00:00:00Z") });
    expect(projection(history({ 0: { t: 1e9 }, 29: { t: 1.001e9 } }))).toEqual({ kind: "far" });
    expect(projection(history({ 0: { t: 2e9 }, 29: { t: 1e9 } }))).toEqual({ kind: "none" });
    expect(projection(history({ 29: { t: 1e9 } }))).toEqual({ kind: "none" });
  });

  it("splits the size into the 3 largest tables and the others", () => {
    const series = tableSeries(history({ 28: { a: 5, b: 1 }, 29: { a: 90, b: 6, c: 3, d: 1 } }));
    expect(series.names).toEqual(["a", "b", "c"]);
    expect(series.days[27]).toBeNull();
    expect(series.days[28]).toEqual([5, 1, 0, 0]);
    expect(series.days[29]).toEqual([90, 6, 3, 1]);
    expect(largestShare(series)).toBeCloseTo(0.9);
    expect(largestShare(tableSeries(history({})))).toBeNull();
  });

  it("sums the flights and writes days in French", () => {
    expect(flightTotals(history({}))).toEqual({ real: 30, simulated: 60, all: 90 });
    expect(shortDay("2026-11-13")).toBe("13 nov.");
    expect(monthYear(new Date("2029-03-02T00:00:00Z"))).toBe("mars 2029");
  });
});
