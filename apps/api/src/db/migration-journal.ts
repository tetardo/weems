import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Versioned migrations of the API (pnpm db:generate), applied by Drizzle. */
export const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../migrations", import.meta.url));

/** A migration this code brings, as Drizzle records it once applied. */
export interface MigrationFile {
  tag: string;
  /** `when` of the journal: Drizzle's created_at, which decides what is still to apply. */
  createdAtMs: number;
  /** SHA-256 of the file, computed like Drizzle's migrator (the hash column). */
  hash: string;
}

interface Journal {
  entries: { tag: string; when: number }[];
}

const readJournal = (folder: string) =>
  JSON.parse(readFileSync(`${folder}/meta/_journal.json`, "utf8")) as Journal;

/** Migrations of migrations/meta/_journal.json, oldest first. */
export function readMigrationFiles(folder = MIGRATIONS_FOLDER): MigrationFile[] {
  return readJournal(folder).entries.map(({ tag, when }) => ({
    tag,
    createdAtMs: when,
    hash: createHash("sha256")
      .update(readFileSync(`${folder}/${tag}.sql`, "utf8"))
      .digest("hex"),
  }));
}

/** Number of migrations this code brings, to compare with the database. */
export function countMigrationFiles(): number {
  return readJournal(MIGRATIONS_FOLDER).entries.length;
}
