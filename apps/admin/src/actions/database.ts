"use server";

import type { DatabaseCleanupRequest, DatabaseCleanupResult } from "@weems/contrats";
import { database } from "../server/console.ts";
import type { BackupFile } from "../server/database/backups.ts";
import type { DatabaseView } from "../server/database/database-page.ts";
import { asAdmin } from "./as-admin.ts";
import { type ActionResult, attempt } from "./result.ts";

/** Page Base de données: the API's reading, with the console's size history and backups. */
export async function readDatabase(): Promise<ActionResult<DatabaseView>> {
  return attempt(async () => database().view(await asAdmin((api) => api.database())));
}

/** « Sauvegarder maintenant »: pg_dump in the database container, the 7 newest kept. */
export async function backupDatabase(): Promise<ActionResult<BackupFile>> {
  return attempt(() => database().backup());
}

/** « Appliquer les migrations »: pnpm --filter @weems/api db:migrate. */
export async function migrateDatabase(): Promise<ActionResult<string>> {
  return attempt(() => database().migrate());
}

/** « Nettoyer »: deleted by the API, after the confirmation of the page. */
export async function cleanDatabase(
  request: DatabaseCleanupRequest,
): Promise<ActionResult<DatabaseCleanupResult>> {
  return attempt(() => asAdmin((api) => api.cleanup(request)));
}
