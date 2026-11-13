import { bigint, date, jsonb, pgTable, timestamp } from "drizzle-orm/pg-core";

/**
 * Size readings of the database, one row per UTC day (the last reading of the day), recorded by
 * the API every hour and kept 13 months: the charts of the page Base de données (spec admin).
 */
export const databaseSizeReadings = pgTable("database_size_readings", {
  day: date("day", { mode: "string" }).primaryKey(),
  totalBytes: bigint("total_bytes", { mode: "number" }).notNull(),
  /** Total size of each table of the schema public, by name. */
  tables: jsonb("tables").$type<Record<string, number>>().notNull(),
  recordedAt: timestamp("recorded_at", {
    withTimezone: true,
    precision: 3,
    mode: "date",
  }).notNull(),
});
