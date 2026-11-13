import type { AdminSupervision, LauncherOverview } from "@weems/contrats";
import { DISK_BYTES } from "../features/database/history.ts";
import { apiSummary, SLOW_P95_MS } from "../features/supervision/figures.ts";

/**
 * Fictitious revenue until payments exist (lot 2): a made-up average per active account, so that
 * the launcher's card moves with the population. Replaced by the real sums, never shown as real.
 */
const FICTITIOUS_EUROS_PER_ACCOUNT = { total: 2.4, month: 0.6, previousMonth: 0.5 } as const;
/** Working budget of docs/cadrage/03-fondamentaux.md: less than 100 € a month. */
const MONTH_GOAL_EUROS = 100;
const euros = (accounts: number, perAccount: number) =>
  Math.round(accounts * perAccount * 100) / 100;

/** The cards of the Mac launcher (apps/launcher), from the page Supervision and the Mac's files. */
export function launcherOverview(
  { tiles, health }: AdminSupervision,
  files: LauncherOverview["files"],
): LauncherOverview {
  const { accounts, flights, live, profiles } = tiles;
  const users = accounts.real + accounts.fictitious;
  return {
    database: {
      bytes: health.database.bytes,
      largestTable: health.database.largestTables[0] ?? null,
      migrations: health.migrations,
      flights: { real: flights.real, simulated: flights.simulated },
      diskBytes: DISK_BYTES,
    },
    files,
    api: {
      p95Ms: apiSummary(health.apiHours).lastP95Ms,
      serverErrors24h: apiSummary(health.apiHours).serverErrors,
      positionsLastMinute: health.positionsPerMinute.at(-1) ?? 0,
      live,
      slowP95Ms: SLOW_P95_MS,
    },
    users: {
      real: accounts.real,
      fictitious: accounts.fictitious,
      newLast7Days: accounts.newLast7Days,
      publicProfiles: profiles.public,
    },
    revenue: {
      fictitious: true,
      totalEuros: euros(users, FICTITIOUS_EUROS_PER_ACCOUNT.total),
      monthEuros: euros(users, FICTITIOUS_EUROS_PER_ACCOUNT.month),
      previousMonthEuros: euros(users, FICTITIOUS_EUROS_PER_ACCOUNT.previousMonth),
      monthGoalEuros: MONTH_GOAL_EUROS,
    },
  };
}
