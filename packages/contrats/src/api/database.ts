import { z } from "zod";
import { UtcTimestamp } from "./common.ts";

/**
 * GET /v1/admin/database and POST /v1/admin/database/cleanup: the page Base de données of the
 * admin console (spec admin, section « Page Base de données »). Administrators only.
 */
const Count = z.number().int().nonnegative();

/** Simulated flights (simulator "replay") older than this many days can be cleaned up. */
export const CLEANUP_SIMULATED_AFTER_DAYS = 7;

export const DatabaseTable = z.object({
  name: z.string(),
  /** PostgreSQL's estimate (statistics of the last ANALYZE), null before the first one. */
  rowsEstimate: Count.nullable(),
  /** Rows and their compressed large values (TOAST), without the indexes. */
  dataBytes: Count,
  indexBytes: Count,
  totalBytes: Count,
  /**
   * Share of the table that belongs to simulated flights (replay or fictitious account), from 0
   * to 1; null for the tables that do not hold flights.
   */
  simulatedShare: z.number().min(0).max(1).nullable(),
});
export type DatabaseTable = z.infer<typeof DatabaseTable>;

/**
 * State of a migration, comparing migrations/ of the code with what Drizzle recorded:
 * - applied: in both, same content;
 * - pending: in the code only, newer than the last applied one (`pnpm db:migrate` applies it);
 * - skipped: in the code only, older than the last applied one: Drizzle will never apply it;
 * - changed: applied, but its file was modified since;
 * - duplicate: recorded more than once;
 * - unknown: recorded in the database, absent from the code (another branch).
 */
export const MigrationState = z.enum([
  "applied",
  "pending",
  "skipped",
  "changed",
  "duplicate",
  "unknown",
]);
export type MigrationState = z.infer<typeof MigrationState>;

export const DatabaseMigration = z.object({
  /** File name without .sql ("0009_site_home_images"); null for an unknown one. */
  tag: z.string().nullable(),
  /** When the migration was generated (Drizzle keeps no date of application). */
  createdAt: UtcTimestamp,
  state: MigrationState,
});
export type DatabaseMigration = z.infer<typeof DatabaseMigration>;

/** What « Nettoyer » would delete now. Real flights are never part of it (EF-14). */
export const DatabaseCleanupPreview = z.object({
  olderThanDays: Count,
  simulatedFlights: z.object({ count: Count, bytes: Count }),
  expiredSessions: Count,
  expiredInvitations: Count,
});
export type DatabaseCleanupPreview = z.infer<typeof DatabaseCleanupPreview>;

/** Days of the charts at the top of the page Base de données. */
export const DATABASE_HISTORY_DAYS = 30;

/**
 * One UTC day of the history: the API's size reading of that day (the last of the day; null
 * before the readings began or on a day the API did not run) and the flights opened that day.
 */
export const DatabaseDay = z.object({
  date: z.iso.date(),
  totalBytes: Count.nullable(),
  /** Total size of each table, by name; null with totalBytes. */
  tables: z.record(z.string(), Count).nullable(),
  realFlights: Count,
  /** Replayed (simulator "replay") or flown by a fictitious account. */
  simulatedFlights: Count,
});
export type DatabaseDay = z.infer<typeof DatabaseDay>;

export const AdminDatabase = z.object({
  generatedAt: UtcTimestamp,
  /** "PostgreSQL 16.4" and the database's name. */
  server: z.object({ version: z.string(), name: z.string() }),
  totalBytes: Count,
  /** Tables of the application, largest first. */
  tables: z.array(DatabaseTable),
  /** Newest first. */
  migrations: z.array(DatabaseMigration),
  cleanup: DatabaseCleanupPreview,
  /** The last DATABASE_HISTORY_DAYS days, oldest first, today last. */
  history: z.array(DatabaseDay),
});
export type AdminDatabase = z.infer<typeof AdminDatabase>;

/** Body of POST /v1/admin/database/cleanup: what to delete, at least one. */
export const DatabaseCleanupRequest = z
  .object({
    simulatedFlights: z.boolean(),
    expiredSessions: z.boolean(),
    expiredInvitations: z.boolean(),
  })
  .refine((body) => body.simulatedFlights || body.expiredSessions || body.expiredInvitations, {
    message: "Nothing to clean up: choose at least one.",
  });
export type DatabaseCleanupRequest = z.infer<typeof DatabaseCleanupRequest>;

/** How many of each were deleted. */
export const DatabaseCleanupResult = z.object({
  simulatedFlights: Count,
  expiredSessions: Count,
  expiredInvitations: Count,
});
export type DatabaseCleanupResult = z.infer<typeof DatabaseCleanupResult>;
