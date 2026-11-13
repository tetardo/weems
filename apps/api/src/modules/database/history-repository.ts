import { asc, gte, lt, sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { databaseSizeReadings } from "../../db/schema.ts";

/** A size reading of one UTC day (YYYY-MM-DD). */
export interface SizeReading {
  day: string;
  totalBytes: number;
  tables: Record<string, number>;
}

/** Flights opened during one UTC day, real and simulated apart. */
export interface FlightsOfDay {
  day: string;
  real: number;
  simulated: number;
}

/** Readings of database_size_readings and flights per day: the charts of the page Base de données. */
export class HistoryRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /** Keeps one reading per day: a later one of the same day replaces it. */
  async record(reading: SizeReading, at: Date): Promise<void> {
    const row = { ...reading, recordedAt: at };
    await this.db
      .insert(databaseSizeReadings)
      .values(row)
      .onConflictDoUpdate({ target: databaseSizeReadings.day, set: row });
  }

  /** Deletes the readings of the days before this one. */
  async prune(beforeDay: string): Promise<void> {
    await this.db.delete(databaseSizeReadings).where(lt(databaseSizeReadings.day, beforeDay));
  }

  /** Readings from this day on, oldest first. */
  async readings(fromDay: string): Promise<SizeReading[]> {
    return this.db
      .select({
        day: databaseSizeReadings.day,
        totalBytes: databaseSizeReadings.totalBytes,
        tables: databaseSizeReadings.tables,
      })
      .from(databaseSizeReadings)
      .where(gte(databaseSizeReadings.day, fromDay))
      .orderBy(asc(databaseSizeReadings.day));
  }

  /**
   * Flights opened from this UTC day on, per day. Simulated as on the page Supervision: replayed
   * or flown by a fictitious account. Days without a flight are absent.
   */
  async flightsPerDay(fromDay: string): Promise<FlightsOfDay[]> {
    const result = await this.db.execute(
      sql`select to_char((f.opened_at at time zone 'UTC')::date, 'YYYY-MM-DD') as day,
          count(*) filter (where not (f.simulator = 'replay' or coalesce(u.fictitious, false))) as real,
          count(*) filter (where f.simulator = 'replay' or coalesce(u.fictitious, false)) as simulated
        from flights f left join users u on u.id = f.pilot_id
        where f.opened_at >= ${`${fromDay}T00:00:00Z`}::timestamptz
        group by 1 order by 1`,
    );
    return (result.rows as Record<"day" | "real" | "simulated", unknown>[]).map((row) => ({
      day: String(row.day),
      real: Number(row.real),
      simulated: Number(row.simulated),
    }));
  }
}
