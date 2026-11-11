import { eq } from "drizzle-orm";
import type { TrackPoint } from "@weems/contrats";
import type { Database } from "../../db/client.ts";
import { flightTracks } from "../../db/schema.ts";

/** A trajectory as stored: the raw points stay compressed, only the simplified ones are read. */
export interface StoredTrack {
  recordedPoints: number;
  sha256: string;
  simplified: TrackPoint[];
}

export interface NewTrack extends StoredTrack {
  /** Every received point, gzip-compressed JSON. */
  points: Buffer;
}

/**
 * Where trajectories live. PostgreSQL for now (spec J2); an S3 store can replace it
 * behind the same interface when volume calls for it.
 */
export interface TrackStore {
  find(flightId: string): Promise<StoredTrack | null>;
  /** Inserts unless the flight already has a trajectory. Returns false when it had one. */
  insert(flightId: string, track: NewTrack): Promise<boolean>;
}

export class PostgresTrackStore implements TrackStore {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async find(flightId: string): Promise<StoredTrack | null> {
    const rows = await this.db
      .select({
        recordedPoints: flightTracks.recordedPoints,
        sha256: flightTracks.sha256,
        simplified: flightTracks.simplified,
      })
      .from(flightTracks)
      .where(eq(flightTracks.flightId, flightId));
    const row = rows[0];
    return row ? { ...row, simplified: row.simplified as TrackPoint[] } : null;
  }

  async insert(flightId: string, track: NewTrack): Promise<boolean> {
    const inserted = await this.db
      .insert(flightTracks)
      .values({ flightId, ...track, receivedAt: new Date() })
      .onConflictDoNothing()
      .returning({ flightId: flightTracks.flightId });
    return inserted.length > 0;
  }
}
