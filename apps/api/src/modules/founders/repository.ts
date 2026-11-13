import { and, count, desc, eq, inArray, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { founders, users } from "../../db/schema.ts";

export interface FounderRecord {
  number: number;
  pilotId: string;
  qualifiedAt: Date;
  confirmedAt: Date | null;
  refusedAt: Date | null;
}

/** Any number: serialises the attribution of founder places (pg_advisory_xact_lock). */
const PLACES_LOCK = 4_202_611;

const columns = {
  number: founders.number,
  pilotId: founders.pilotId,
  qualifiedAt: founders.qualifiedAt,
  confirmedAt: founders.confirmedAt,
  refusedAt: founders.refusedAt,
};

/** Founder places (table founders). */
export class FoundersRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async findByPilot(pilotId: string): Promise<FounderRecord | null> {
    const [row] = await this.db.select(columns).from(founders).where(eq(founders.pilotId, pilotId));
    return row ?? null;
  }

  async findByNumber(number: number): Promise<FounderRecord | null> {
    const [row] = await this.db.select(columns).from(founders).where(eq(founders.number, number));
    return row ?? null;
  }

  /** Places taken: founders not refused. */
  async taken(): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(founders)
      .where(isNull(founders.refusedAt));
    return row?.n ?? 0;
  }

  /**
   * Gives the pilot the next number if a place is left, in one transaction under a lock: two
   * pilots qualifying at the same time never exceed the places. Null when full or already given.
   */
  async claim(pilotId: string, places: number, at: Date): Promise<number | null> {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(${PLACES_LOCK})`);
      const [taken] = await tx
        .select({ n: count() })
        .from(founders)
        .where(isNull(founders.refusedAt));
      if ((taken?.n ?? 0) >= places) return null;
      const [row] = await tx
        .insert(founders)
        .values({ pilotId, qualifiedAt: at })
        .onConflictDoNothing({ target: founders.pilotId })
        .returning({ number: founders.number });
      return row?.number ?? null;
    });
  }

  /** Every place, newest first, with the account's public name. */
  async list(): Promise<(FounderRecord & { name: string | null })[]> {
    return this.db
      .select({ ...columns, name: users.name })
      .from(founders)
      .leftJoin(users, eq(users.id, founders.pilotId))
      .orderBy(desc(founders.number));
  }

  /** Places of these pilots, refused ones included. */
  async ofPilots(pilotIds: readonly string[]): Promise<FounderRecord[]> {
    if (pilotIds.length === 0) return [];
    return this.db
      .select(columns)
      .from(founders)
      .where(inArray(founders.pilotId, [...pilotIds]));
  }

  /**
   * Confirmed places (from the console, or qualified at or before `reviewedBefore`), highest
   * number first.
   */
  async latestConfirmed(reviewedBefore: Date, limit: number): Promise<FounderRecord[]> {
    const confirmed = or(
      isNotNull(founders.confirmedAt),
      lte(founders.qualifiedAt, reviewedBefore),
    );
    return this.db
      .select(columns)
      .from(founders)
      .where(and(isNull(founders.refusedAt), confirmed))
      .orderBy(desc(founders.number))
      .limit(limit);
  }

  async confirm(number: number, at: Date): Promise<void> {
    await this.db.update(founders).set({ confirmedAt: at }).where(eq(founders.number, number));
  }

  async refuse(number: number, at: Date): Promise<void> {
    await this.db.update(founders).set({ refusedAt: at }).where(eq(founders.number, number));
  }
}
