import { GoalDefinition, uuidV7 } from "@weems/contrats";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { goals } from "../../db/schema.ts";
import type { GoalRecord } from "./goal-view.ts";

/** The only place that reads and writes the pilots' goals. */
export class GoalsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /** Every goal of the pilot, newest first. */
  async allOf(pilotId: string): Promise<GoalRecord[]> {
    const rows = await this.db
      .select()
      .from(goals)
      .where(eq(goals.pilotId, pilotId))
      .orderBy(desc(goals.createdAt));
    return rows.map((row) => ({
      goalId: row.id,
      definition: GoalDefinition.parse(row.definition),
      createdAt: row.createdAt,
      archivedAt: row.archivedAt,
    }));
  }

  async create(pilotId: string, definition: GoalDefinition, at: Date): Promise<string> {
    const id = uuidV7();
    await this.db.insert(goals).values({ id, pilotId, definition, createdAt: at, updatedAt: at });
    return id;
  }

  /** False when the pilot has no such goal. */
  async update(pilotId: string, goalId: string, definition: GoalDefinition, at: Date) {
    const rows = await this.db
      .update(goals)
      .set({ definition, updatedAt: at })
      .where(and(eq(goals.id, goalId), eq(goals.pilotId, pilotId)))
      .returning({ id: goals.id });
    return rows.length > 0;
  }

  /** Sets goals aside (already archived ones keep their date). */
  async archive(pilotId: string, goalIds: readonly string[], at: Date): Promise<void> {
    for (const goalId of goalIds) {
      await this.db
        .update(goals)
        .set({ archivedAt: at, updatedAt: at })
        .where(and(eq(goals.id, goalId), eq(goals.pilotId, pilotId), isNull(goals.archivedAt)));
    }
  }
}
