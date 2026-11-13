import { PlanId } from "@weems/contrats";
import { eq } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { testPlans } from "../../db/schema.ts";

/** Plans set by the test switch of the site bar (table test_plans), outside production only. */
export class TestPlansRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async planOf(pilotId: string): Promise<PlanId | null> {
    const [row] = await this.db
      .select({ plan: testPlans.plan })
      .from(testPlans)
      .where(eq(testPlans.pilotId, pilotId));
    return row ? PlanId.parse(row.plan) : null;
  }

  /** Every plan set, by pilot: a pilot without a row is on Pilot Free. */
  async allPlans(): Promise<Map<string, PlanId>> {
    const rows = await this.db
      .select({ pilotId: testPlans.pilotId, plan: testPlans.plan })
      .from(testPlans);
    return new Map(rows.map((row) => [row.pilotId, PlanId.parse(row.plan)]));
  }

  async setPlan(pilotId: string, plan: PlanId): Promise<void> {
    const updatedAt = new Date();
    await this.db
      .insert(testPlans)
      .values({ pilotId, plan, updatedAt })
      .onConflictDoUpdate({ target: testPlans.pilotId, set: { plan, updatedAt } });
  }
}
