import { fileURLToPath } from "node:url";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "./schema.ts";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  /** Cheap round trip, used by the health check. */
  ping(): Promise<void>;
  close(): Promise<void>;
}

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../migrations", import.meta.url));

export function connectDatabase(url: string): DatabaseHandle {
  const pool = new pg.Pool({ connectionString: url, max: 10 });
  return {
    db: drizzle(pool, { schema }),
    ping: async () => {
      await pool.query("select 1");
    },
    close: () => pool.end(),
  };
}

/** Applies the versioned migrations of migrations/ that are not applied yet. */
export async function migrateDatabase(handle: DatabaseHandle): Promise<void> {
  await migrate(handle.db, { migrationsFolder: MIGRATIONS_FOLDER });
}
