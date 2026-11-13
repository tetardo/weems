import { z } from "zod";

/**
 * Route /api/lifecycle of the console, called on the Mac by the scripts of scripts/mac/ and by
 * the Mac launcher (apps/launcher, fiche 020). Not an API format: a contract between two local
 * programs.
 */

/** Header the local programs send: a web page cannot add it without a CORS preflight, refused. */
export const LOCAL_SCRIPT_HEADER = "x-weems-local-script";

export const LocalServiceId = z.enum(["db", "api", "site"]);
export type LocalServiceId = z.infer<typeof LocalServiceId>;

export const LifecycleRequest = z.union([
  z.object({ action: z.enum(["start-all", "stop-all"]) }),
  z.object({ action: z.enum(["start", "stop", "restart"]), service: LocalServiceId }),
]);
export type LifecycleRequest = z.infer<typeof LifecycleRequest>;

export const LocalServiceStatus = z.object({
  id: LocalServiceId,
  state: z.enum(["running", "starting", "stopped", "error"]),
  /** Who runs it: the console (pnpm dev), Docker, or a launch the console did not make. */
  runner: z.enum(["console", "docker", "outside"]).nullable(),
  port: z.number().int().positive(),
  /** Start time, when the console started it. */
  since: z.string().nullable(),
  error: z.string().nullable(),
});
export type LocalServiceStatus = z.infer<typeof LocalServiceStatus>;

/** GET /api/lifecycle[?logs=<service>]: the services, and the last lines of one when asked. */
export const LifecycleStatus = z.object({
  services: z.array(LocalServiceStatus),
  dockerAvailable: z.boolean(),
  logs: z.array(z.string()).nullable(),
});
export type LifecycleStatus = z.infer<typeof LifecycleStatus>;

const Count = z.number().int().nonnegative();

/**
 * GET /api/overview of the console: the four cards of the Mac launcher, made from the page
 * Supervision (GET /v1/admin/supervision). Counts include the fictitious accounts and simulated
 * flights, shown apart.
 */
export const LauncherOverview = z.object({
  database: z.object({
    bytes: Count,
    largestTable: z.object({ name: z.string(), bytes: Count }).nullable(),
    migrations: z.object({ applied: Count, expected: Count }),
    flights: z.object({ real: Count, simulated: Count }),
    /** Disk of the alpha server (20 Go): the progress circle of the card. */
    diskBytes: Count,
  }),
  /** Files the console keeps on the Mac: backups (pg_dump) and the Mac's disk. */
  files: z.object({
    backups: z.object({ count: Count, bytes: Count, lastAt: z.string().nullable() }),
    disk: z.object({ usedBytes: Count, totalBytes: Count }).nullable(),
  }),
  api: z.object({
    /** 95th percentile of the current hour, null when no request yet. */
    p95Ms: z.number().nonnegative().nullable(),
    serverErrors24h: Count,
    positionsLastMinute: Count,
    live: z.object({ flights: Count, simulated: Count }),
    /** Beyond it the API is slow (page Supervision): the progress circle of the card. */
    slowP95Ms: Count,
    /** Live flights the load test held (J4): the progress circle of « En direct ». */
    liveTestedFlights: Count,
  }),
  /** Accounts not disabled, the fictitious ones included. */
  users: z.object({
    real: Count,
    fictitious: Count,
    newLast7Days: Count,
    publicProfiles: Count,
  }),
  /** No payment exists yet (lot 2): fictitious figures, said so on the card. */
  revenue: z.object({
    fictitious: z.boolean(),
    totalEuros: z.number().nonnegative(),
    monthEuros: z.number().nonnegative(),
    /** Last month, for the trend arrow of « Ce mois ». */
    previousMonthEuros: z.number().nonnegative(),
    /** Monthly budget (fondamentaux, < 100 €): what « Ce mois » should cover. */
    monthGoalEuros: z.number().positive(),
  }),
});
export type LauncherOverview = z.infer<typeof LauncherOverview>;
