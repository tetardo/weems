import { type SQL, sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";

/**
 * Pieces shared by the read-only queries of the page Supervision. Days are cut at midnight in
 * Paris, the time zone of the console's user.
 */

/** Flights with their pilot's account: `f` and `u`. */
export const FLIGHTS_WITH_PILOT = sql`flights f left join users u on u.id = f.pilot_id`;

/** A real flight: neither replayed (pnpm simulate, pnpm load) nor flown by a fictitious account. */
export const REAL_FLIGHT = sql`(f.simulator <> 'replay' and not coalesce(u.fictitious, false))`;

/** A real account: not fictitious, not disabled. */
export const REAL_ACCOUNT = sql`(not u.fictitious and u.disabled_at is null)`;

/** Midnight in Paris, `daysBack` (an integer expression) days before today, with time zone. */
export function parisMidnight(daysBack: SQL): SQL {
  return sql`((date_trunc('day', now() at time zone 'Europe/Paris') - (${daysBack}) * interval '1 day') at time zone 'Europe/Paris')`;
}

/** Day of a timestamp in Paris, as YYYY-MM-DD. */
export function parisDay(column: SQL): SQL {
  return sql`to_char(${column} at time zone 'Europe/Paris', 'YYYY-MM-DD')`;
}

/** Runs a query and returns its rows, typed by the caller (counts come back as text: Number()). */
export async function rowsOf<T>(db: Database, query: SQL): Promise<T[]> {
  const result = await db.execute(query);
  return result.rows as T[];
}

/** Counts and sums arrive as text from PostgreSQL (bigint, numeric). */
export const num = (value: unknown): number => Number(value ?? 0);
