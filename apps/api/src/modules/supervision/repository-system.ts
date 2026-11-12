import { sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { num, rowsOf } from "./sql-parts.ts";

/** What the page Supervision reads of PostgreSQL itself: size, largest tables, migrations. */
export class SupervisionSystemRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async databaseBytes(): Promise<number> {
    const [row] = await rowsOf<{ bytes: unknown }>(
      this.db,
      sql`select pg_database_size(current_database()) as bytes`,
    );
    return num(row?.bytes);
  }

  /** Tables of the application with their indexes and compressed data, largest first. */
  async largestTables(limit: number): Promise<{ name: string; bytes: number }[]> {
    const rows = await rowsOf<{ name: unknown; bytes: unknown }>(
      this.db,
      sql`select c.relname as name, pg_total_relation_size(c.oid) as bytes
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
        order by 2 desc limit ${limit}`,
    );
    return rows.map((row) => ({ name: String(row.name), bytes: num(row.bytes) }));
  }

  /** Migrations recorded by Drizzle in the database (0 before the first one). */
  async appliedMigrations(): Promise<number> {
    const [table] = await rowsOf<{ name: unknown }>(
      this.db,
      sql`select to_regclass('drizzle.__drizzle_migrations') as name`,
    );
    if (table?.name === null) return 0;
    const [row] = await rowsOf<{ count: unknown }>(
      this.db,
      sql`select count(*) as count from drizzle.__drizzle_migrations`,
    );
    return num(row?.count);
  }
}
