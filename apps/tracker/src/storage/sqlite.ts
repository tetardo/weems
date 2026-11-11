import { DatabaseSync } from "node:sqlite";

/**
 * The tracker's SQLite: the one built into Node and Electron (node:sqlite), so the desktop app
 * has no native module to build (J3: better-sqlite3 had no ready-made binary for Electron 45).
 */
export type Database = DatabaseSync;

export function openDatabase(path: string): Database {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

/** Runs `work` in one transaction: all of it is written, or nothing. */
export function inTransaction<T>(db: Database, work: () => T): T {
  db.exec("BEGIN");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
