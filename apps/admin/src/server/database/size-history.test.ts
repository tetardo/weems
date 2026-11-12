import { describe, expect, it } from "vitest";
import { type SizeSnapshot, growthOf, localDay, withSnapshot } from "./size-history.ts";

const snap = (date: string, total: number, tracks = total): SizeSnapshot => ({
  date,
  totalBytes: total,
  tables: { flight_tracks: tracks },
});

describe("size history of the page Base de données", () => {
  it("counts local days back", () => {
    expect(localDay(new Date(2026, 10, 12, 18), 7)).toBe("2026-11-05");
    expect(localDay(new Date(2026, 2, 3, 9), 7)).toBe("2026-02-24");
  });

  it("keeps one reading per day, oldest first, the last 31 days", () => {
    const history = [snap("2026-11-10", 1), snap("2026-11-12", 2)];
    const next = withSnapshot(history, snap("2026-11-12", 5));
    expect(next.map((s) => [s.date, s.totalBytes])).toEqual([
      ["2026-11-10", 1],
      ["2026-11-12", 5],
    ]);
    const long = Array.from({ length: 40 }, (_, i) => snap(localDay(new Date(2026, 10, 12), i), i));
    expect(withSnapshot(long, snap("2026-11-13", 0))).toHaveLength(31);
  });

  it("measures growth against the reading of 7 days ago", () => {
    const history = [snap("2026-11-01", 10), snap("2026-11-05", 40), snap("2026-11-08", 70)];
    const growth = growthOf(history, snap("2026-11-12", 100));
    expect(growth).toEqual({ since: "2026-11-05", totalBytes: 60, tables: { flight_tracks: 60 } });
  });

  it("falls back on the oldest reading before today, or nothing on the first day", () => {
    const growth = growthOf(
      [snap("2026-11-10", 30), snap("2026-11-12", 35)],
      snap("2026-11-12", 50),
    );
    expect(growth?.since).toBe("2026-11-10");
    expect(growthOf([snap("2026-11-12", 50)], snap("2026-11-12", 60))).toBeNull();
  });

  it("counts a new table from zero", () => {
    const today: SizeSnapshot = { date: "2026-11-12", totalBytes: 9, tables: { fresh: 9 } };
    expect(growthOf([snap("2026-11-01", 0)], today)?.tables).toEqual({ fresh: 9 });
  });
});
