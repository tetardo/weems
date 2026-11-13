import { and, eq, gt, isNull, lte } from "drizzle-orm";
import { uuidV7 } from "@weems/contrats";
import type { Database } from "../../db/client.ts";
import { planGrants } from "../../db/schema.ts";

export type GrantSource = "founder" | "code" | "admin";

export interface GrantRecord {
  plan: string;
  source: GrantSource;
  startsAt: Date;
  endsAt: Date;
}

/** Plans given without payment (table plan_grants): written by the plans service only. */
export class GrantsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /** Gifts not revoked that end after `now`, earliest start first. */
  async running(pilotId: string, now: Date): Promise<GrantRecord[]> {
    const rows = await this.db
      .select({
        plan: planGrants.plan,
        source: planGrants.source,
        startsAt: planGrants.startsAt,
        endsAt: planGrants.endsAt,
      })
      .from(planGrants)
      .where(
        and(
          eq(planGrants.pilotId, pilotId),
          isNull(planGrants.revokedAt),
          gt(planGrants.endsAt, now),
        ),
      )
      .orderBy(planGrants.startsAt);
    return rows.map((row) => ({ ...row, source: row.source as GrantSource }));
  }

  /** Plan given to each pilot right now (console, page Comptes). */
  async currentByPilot(now: Date): Promise<Map<string, string>> {
    const rows = await this.db
      .selectDistinct({ pilotId: planGrants.pilotId, plan: planGrants.plan })
      .from(planGrants)
      .where(
        and(
          isNull(planGrants.revokedAt),
          lte(planGrants.startsAt, now),
          gt(planGrants.endsAt, now),
        ),
      );
    return new Map(rows.map((row) => [row.pilotId, row.plan]));
  }

  async insert(pilotId: string, grant: GrantRecord, now: Date): Promise<void> {
    await this.db.insert(planGrants).values({ id: uuidV7(), pilotId, ...grant, createdAt: now });
  }

  /** Ends every gift of this source still running (a refused founder). */
  async revoke(pilotId: string, source: GrantSource, now: Date): Promise<void> {
    await this.db
      .update(planGrants)
      .set({ revokedAt: now })
      .where(
        and(
          eq(planGrants.pilotId, pilotId),
          eq(planGrants.source, source),
          isNull(planGrants.revokedAt),
          gt(planGrants.endsAt, now),
        ),
      );
  }
}
