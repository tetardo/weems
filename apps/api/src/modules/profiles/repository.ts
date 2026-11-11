import { and, asc, eq } from "drizzle-orm";
import { type PilotLevel, PilotLevel as PilotLevelSchema } from "@weems/contrats";
import type { Database } from "../../db/client.ts";
import { hiddenFlights, pilotPhotos, pilotProfiles } from "../../db/schema.ts";

/** A pilot's profile as stored. */
export interface ProfileRecord {
  pilotId: string;
  handle: string | null;
  isPublic: boolean;
  country: string | null;
  homeIcao: string | null;
  level: PilotLevel | null;
  vatsimId: string | null;
  ivaoId: string | null;
  instagram: string | null;
  facebook: string | null;
  simbriefId: string | null;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
  updatedAt: Date;
}

type ProfileRow = typeof pilotProfiles.$inferSelect;

const toRecord = (row: ProfileRow): ProfileRecord => ({
  ...row,
  level: row.level === null ? null : PilotLevelSchema.parse(row.level),
});

/** PostgreSQL "unique_violation": the handle belongs to someone else. */
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  const cause = error instanceof Error && "cause" in error ? error.cause : error;
  return typeof cause === "object" && cause !== null && "code" in cause
    ? cause.code === UNIQUE_VIOLATION
    : false;
}

/** The only place that reads and writes profiles, hidden flights and photos. */
export class ProfilesRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async find(pilotId: string): Promise<ProfileRecord | null> {
    const [row] = await this.db
      .select()
      .from(pilotProfiles)
      .where(eq(pilotProfiles.pilotId, pilotId));
    return row ? toRecord(row) : null;
  }

  /** The profile at this address, only while it is public. */
  async findPublic(handle: string): Promise<ProfileRecord | null> {
    const [row] = await this.db
      .select()
      .from(pilotProfiles)
      .where(and(eq(pilotProfiles.handle, handle), eq(pilotProfiles.isPublic, true)));
    return row ? toRecord(row) : null;
  }

  async isHandleTaken(handle: string, exceptPilotId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ pilotId: pilotProfiles.pilotId })
      .from(pilotProfiles)
      .where(eq(pilotProfiles.handle, handle));
    return row !== undefined && row.pilotId !== exceptPilotId;
  }

  /** Creates or replaces the profile. Returns false when the handle is someone else's. */
  async save(profile: ProfileRecord): Promise<boolean> {
    const { pilotId: _pilotId, ...values } = profile;
    try {
      await this.db
        .insert(pilotProfiles)
        .values(profile)
        .onConflictDoUpdate({ target: pilotProfiles.pilotId, set: values });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      throw error;
    }
  }

  /** Address of every public profile, by pilot (admin console). */
  async publicHandles(): Promise<Map<string, string>> {
    const rows = await this.db
      .select({ pilotId: pilotProfiles.pilotId, handle: pilotProfiles.handle })
      .from(pilotProfiles)
      .where(eq(pilotProfiles.isPublic, true));
    return new Map(rows.flatMap((row) => (row.handle ? [[row.pilotId, row.handle]] : [])));
  }

  /** Public profiles, for the site map. */
  async listPublic(): Promise<{ handle: string; updatedAt: Date }[]> {
    const rows = await this.db
      .select({ handle: pilotProfiles.handle, updatedAt: pilotProfiles.updatedAt })
      .from(pilotProfiles)
      .where(eq(pilotProfiles.isPublic, true))
      .orderBy(asc(pilotProfiles.handle));
    return rows.flatMap((row) =>
      row.handle ? [{ handle: row.handle, updatedAt: row.updatedAt }] : [],
    );
  }

  async hiddenFlightsOf(pilotId: string): Promise<string[]> {
    const rows = await this.db
      .select({ flightId: hiddenFlights.flightId })
      .from(hiddenFlights)
      .where(eq(hiddenFlights.pilotId, pilotId));
    return rows.map((row) => row.flightId);
  }

  async isHidden(flightId: string): Promise<boolean> {
    const rows = await this.db
      .select({ flightId: hiddenFlights.flightId })
      .from(hiddenFlights)
      .where(eq(hiddenFlights.flightId, flightId));
    return rows.length > 0;
  }

  async setHidden(pilotId: string, flightId: string, hidden: boolean): Promise<void> {
    if (!hidden) {
      await this.db.delete(hiddenFlights).where(eq(hiddenFlights.flightId, flightId));
      return;
    }
    await this.db
      .insert(hiddenFlights)
      .values({ flightId, pilotId, hiddenAt: new Date() })
      .onConflictDoNothing();
  }

  async findPhoto(pilotId: string): Promise<Buffer | null> {
    const [row] = await this.db
      .select({ webp: pilotPhotos.webp })
      .from(pilotPhotos)
      .where(eq(pilotPhotos.pilotId, pilotId));
    return row?.webp ?? null;
  }

  async hasPhoto(pilotId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ pilotId: pilotPhotos.pilotId })
      .from(pilotPhotos)
      .where(eq(pilotPhotos.pilotId, pilotId));
    return row !== undefined;
  }

  async savePhoto(pilotId: string, webp: Buffer): Promise<void> {
    const values = { webp, updatedAt: new Date() };
    await this.db
      .insert(pilotPhotos)
      .values({ pilotId, ...values })
      .onConflictDoUpdate({ target: pilotPhotos.pilotId, set: values });
  }

  async deletePhoto(pilotId: string): Promise<void> {
    await this.db.delete(pilotPhotos).where(eq(pilotPhotos.pilotId, pilotId));
  }
}
