import { and, eq, inArray, lt, sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { flightEvents, flightReviews, flights, flightTracks } from "../../db/schema.ts";

/** What can delete rows: the database or one of its transactions. */
type Writer = Pick<Database, "delete">;

/** Deletes flights with their events, trajectory and review (hidden flights follow by cascade). */
export async function deleteFlightsWithChildren(tx: Writer, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await tx.delete(flightEvents).where(inArray(flightEvents.flightId, ids));
  await tx.delete(flightTracks).where(inArray(flightTracks.flightId, ids));
  await tx.delete(flightReviews).where(inArray(flightReviews.flightId, ids));
  await tx.delete(flights).where(inArray(flights.id, ids));
}

/** Simulated flights (pnpm simulate, pnpm load) opened before this date. Never a real one. */
const simulatedBefore = (before: Date) =>
  and(eq(flights.simulator, "replay"), lt(flights.openedAt, before));

/**
 * Cleanup of the page Base de données (console spec): old simulated flights. The flights of the
 * fictitious accounts are left alone: their history is dated in the past on purpose (populate).
 */
export class FlightsCleanupRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /** How many, and the stored size of their trajectories (the bulk of what is freed). */
  async simulatedBefore(before: Date): Promise<{ count: number; bytes: number }> {
    const [row] = await this.db
      .select({
        count: sql<string>`count(*)`,
        bytes: sql<string>`coalesce(sum(pg_column_size(${flightTracks.points}) + pg_column_size(${flightTracks.simplified})), 0)`,
      })
      .from(flights)
      .leftJoin(flightTracks, eq(flightTracks.flightId, flights.id))
      .where(simulatedBefore(before));
    return { count: Number(row?.count ?? 0), bytes: Number(row?.bytes ?? 0) };
  }

  /** Deletes them in one transaction. Returns the deleted ids. */
  async deleteSimulatedBefore(before: Date): Promise<string[]> {
    return this.db.transaction(async (tx) => {
      const rows = await tx.select({ id: flights.id }).from(flights).where(simulatedBefore(before));
      const ids = rows.map((row) => row.id);
      await deleteFlightsWithChildren(tx, ids);
      return ids;
    });
  }
}
