import type { DatabaseMigration } from "@weems/contrats";
import type { MigrationFile } from "../../db/migration-journal.ts";
import type { RecordedMigration } from "./repository.ts";

const iso = (ms: number) => new Date(ms).toISOString();

/** State of one migration of the code, given Drizzle's rows recorded with its date. */
function stateOf(
  file: MigrationFile,
  rows: RecordedMigration[],
  lastAppliedMs: number,
): DatabaseMigration["state"] {
  const [first] = rows;
  if (!first) return file.createdAtMs > lastAppliedMs ? "pending" : "skipped";
  if (rows.length > 1) return "duplicate";
  return first.hash === file.hash ? "applied" : "changed";
}

/**
 * Compares the migrations of the code with Drizzle's record (contract MigrationState). Drizzle
 * applies only what is newer than its last record: an older file missing is « skipped » for
 * good. A record that matches no date of the code is « unknown », or « duplicate » when its
 * content is one of the code's migrations applied again. Newest first.
 */
export function migrationStates(
  files: MigrationFile[],
  recorded: RecordedMigration[],
): DatabaseMigration[] {
  const byDate = new Map<number, RecordedMigration[]>();
  for (const row of recorded)
    byDate.set(row.createdAtMs, [...(byDate.get(row.createdAtMs) ?? []), row]);
  const lastAppliedMs = Math.max(-Infinity, ...recorded.map((row) => row.createdAtMs));
  const known = new Set(files.map((file) => file.createdAtMs));
  const tagOfHash = new Map(files.map((file) => [file.hash, file.tag]));
  const states: DatabaseMigration[] = files.map((file) => ({
    tag: file.tag,
    createdAt: iso(file.createdAtMs),
    state: stateOf(file, byDate.get(file.createdAtMs) ?? [], lastAppliedMs),
  }));
  for (const row of recorded) {
    if (known.has(row.createdAtMs)) continue;
    const tag = tagOfHash.get(row.hash) ?? null;
    states.push({ tag, createdAt: iso(row.createdAtMs), state: tag ? "duplicate" : "unknown" });
  }
  return states.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
