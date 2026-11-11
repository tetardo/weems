import { eq, gte } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { flightReviews, flights, flightTracks } from "../../db/schema.ts";
import type { FlightFacts } from "./alpha-report.ts";

/** Reads, for the alpha report, the facts of every flight opened since `since`. */
export class AlphaRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async flightFacts(since: Date): Promise<FlightFacts[]> {
    const rows = await this.db
      .select({
        pilotId: flights.pilotId,
        openedAt: flights.openedAt,
        closedAt: flights.closedAt,
        trackFlightId: flightTracks.flightId,
        phases: flightReviews.phases,
      })
      .from(flights)
      .leftJoin(flightTracks, eq(flightTracks.flightId, flights.id))
      .leftJoin(flightReviews, eq(flightReviews.flightId, flights.id))
      .where(gte(flights.openedAt, since));
    return rows.map(({ trackFlightId, ...row }) => ({
      ...row,
      hasTrack: trackFlightId !== null,
      phases: row.phases as FlightFacts["phases"],
    }));
  }
}
