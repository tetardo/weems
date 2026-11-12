import { eq } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { accounts, users } from "../../db/schema.ts";

export interface FictitiousAccount {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/** Fictitious accounts of the simulated activity (development only, page Activité simulée). */
export class FictitiousAccountsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /** Creates the accounts, all with the same password, in one transaction. */
  async insert(pilots: readonly FictitiousAccount[], passwordHash: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(users).values(
        pilots.map((pilot) => ({
          ...pilot,
          emailVerified: true,
          fictitious: true,
          updatedAt: pilot.createdAt,
        })),
      );
      await tx.insert(accounts).values(
        pilots.map((pilot) => ({
          id: pilot.id,
          accountId: pilot.id,
          providerId: "credential",
          userId: pilot.id,
          password: passwordHash,
          updatedAt: pilot.createdAt,
        })),
      );
    });
  }

  async ids(): Promise<string[]> {
    const rows = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.fictitious, true));
    return rows.map((row) => row.id);
  }

  /** Deletes the fictitious accounts; their profile, photo, sessions and tokens go with them (cascade). */
  async deleteAll(): Promise<number> {
    const deleted = await this.db
      .delete(users)
      .where(eq(users.fictitious, true))
      .returning({ id: users.id });
    return deleted.length;
  }
}
