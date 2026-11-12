import { type SQL, sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";

/** A row of drizzle.__drizzle_migrations: what Drizzle recorded when it applied a migration. */
export interface RecordedMigration {
  hash: string;
  createdAtMs: number;
}

export interface TableSize {
  name: string;
  rowsEstimate: number | null;
  totalBytes: number;
  indexBytes: number;
}

/** Share of each flight table that belongs to simulated flights, from 0 to 1. */
export interface SimulatedShares {
  flights: number;
  flight_events: number;
  flight_tracks: number;
}

const num = (value: unknown): number => Number(value ?? 0);

/**
 * What the page Base de données reads of PostgreSQL itself (catalogue, sizes, Drizzle's record
 * of migrations). Read-only, in SQL across tables, like the supervision module.
 */
export class DatabaseRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private async rows<T>(query: SQL): Promise<T[]> {
    return (await this.db.execute(query)).rows as T[];
  }

  async server(): Promise<{ version: string; name: string; bytes: number }> {
    const [row] = await this.rows<{ version: string; name: string; bytes: unknown }>(
      sql`select current_setting('server_version') as version, current_database() as name,
        pg_database_size(current_database()) as bytes`,
    );
    return { version: row?.version ?? "", name: row?.name ?? "", bytes: num(row?.bytes) };
  }

  /** Tables of the application (schema public), largest first. */
  async tables(): Promise<TableSize[]> {
    const rows = await this.rows<Record<"name" | "rows" | "total" | "indexes", unknown>>(
      sql`select c.relname as name, nullif(c.reltuples, -1)::bigint as rows,
          pg_total_relation_size(c.oid) as total, pg_indexes_size(c.oid) as indexes
        from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
        order by total desc, name`,
    );
    return rows.map((row) => ({
      name: String(row.name),
      rowsEstimate: row.rows === null ? null : num(row.rows),
      totalBytes: num(row.total),
      indexBytes: num(row.indexes),
    }));
  }

  /**
   * Simulated: replayed (pnpm simulate, pnpm load) or flown by a fictitious account, as on the
   * page Supervision. Flights and events by rows, trajectories by stored size.
   */
  async simulatedShares(): Promise<SimulatedShares> {
    const [row] = await this.rows<Record<keyof SimulatedShares, unknown>>(
      sql`with sim as (
          select f.id, (f.simulator = 'replay' or coalesce(u.fictitious, false)) as simulated
          from flights f left join users u on u.id = f.pilot_id)
        select
          (select avg(case when simulated then 1.0 else 0 end) from sim) as flights,
          (select avg(case when s.simulated then 1.0 else 0 end)
            from flight_events e join sim s on s.id = e.flight_id) as flight_events,
          (select sum(case when s.simulated then t.bytes else 0 end) / nullif(sum(t.bytes), 0)
            from (select flight_id, pg_column_size(points) + pg_column_size(simplified) as bytes
              from flight_tracks) t join sim s on s.id = t.flight_id) as flight_tracks`,
    );
    return {
      flights: num(row?.flights),
      flight_events: num(row?.flight_events),
      flight_tracks: num(row?.flight_tracks),
    };
  }

  /** Drizzle's record, oldest first; empty before the first migration. */
  async recordedMigrations(): Promise<RecordedMigration[]> {
    const [table] = await this.rows<{ name: unknown }>(
      sql`select to_regclass('drizzle.__drizzle_migrations') as name`,
    );
    if (table?.name === null || table?.name === undefined) return [];
    const rows = await this.rows<{ hash: unknown; created_at: unknown }>(
      sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at, id`,
    );
    return rows.map((row) => ({ hash: String(row.hash), createdAtMs: num(row.created_at) }));
  }
}
