import type { AdminSupervision } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { launcherOverview } from "./launcher-overview.ts";

const hour = (p95Ms: number | null, serverErrors = 0) => ({ p95Ms, serverErrors });

const supervision = {
  tiles: {
    accounts: { real: 3, newLast7Days: 2, fictitious: 97, pendingInvitations: 0, daily: [] },
    flights: { real: 40, newLast7Days: 5, today: 1, simulated: 900, daily: [] },
    live: { flights: 7, simulated: 5 },
    profiles: { public: 2, realAccounts: 3, newLast7Days: 0, daily: [] },
    suspicious: { stale: 0, withoutTrack: 0 },
  },
  health: {
    apiHours: [hour(80, 1), hour(null), hour(42, 2)],
    positionsPerMinute: [10, 120],
    database: {
      bytes: 1_200_000_000,
      largestTables: [{ name: "flight_tracks", bytes: 1_100_000_000 }],
    },
    migrations: { applied: 14, expected: 14 },
  },
} as unknown as AdminSupervision;

describe("launcherOverview", () => {
  it("makes the four cards from Supervision, fictitious accounts counted apart", () => {
    const overview = launcherOverview(supervision);
    expect(overview.database).toEqual({
      bytes: 1_200_000_000,
      largestTable: { name: "flight_tracks", bytes: 1_100_000_000 },
      migrations: { applied: 14, expected: 14 },
      flights: { real: 40, simulated: 900 },
    });
    expect(overview.api).toEqual({
      p95Ms: 42,
      serverErrors24h: 3,
      positionsLastMinute: 120,
      live: { flights: 7, simulated: 5 },
    });
    expect(overview.users).toEqual({ real: 3, fictitious: 97, newLast7Days: 2, publicProfiles: 2 });
  });

  it("says the revenue is fictitious, and moves it with the population", () => {
    expect(launcherOverview(supervision).revenue).toEqual({
      fictitious: true,
      totalEuros: 240,
      monthEuros: 60,
      previousMonthEuros: 50,
    });
  });
});
