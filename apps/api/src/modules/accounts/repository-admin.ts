import { and, count, desc, eq, isNull, max } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import { oauthAccessTokens, oauthRefreshTokens, sessions, users } from "../../db/schema.ts";

export interface AccountRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  disabledAt: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  fictitious: boolean;
}

/** What the admin console reads and changes on accounts (spec admin, page Comptes). */
export class AdminAccountsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /** Every account with its last session, newest account first. */
  async listAccounts(): Promise<AccountRecord[]> {
    const lastLogins = this.db
      .select({ userId: sessions.userId, at: max(sessions.createdAt).as("last_login_at") })
      .from(sessions)
      .groupBy(sessions.userId)
      .as("last_logins");
    return this.db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        disabledAt: users.disabledAt,
        createdAt: users.createdAt,
        lastLoginAt: lastLogins.at,
        fictitious: users.fictitious,
      })
      .from(users)
      .leftJoin(lastLogins, eq(lastLogins.userId, users.id))
      .orderBy(desc(users.createdAt));
  }

  /** Administrators still active: a disabled one cannot log in. */
  async countAdmins(): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(users)
      .where(and(eq(users.role, "admin"), isNull(users.disabledAt)));
    return row?.n ?? 0;
  }

  async setRole(userId: string, role: string): Promise<void> {
    await this.db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
  }

  async setRoleByEmail(email: string, role: string): Promise<boolean> {
    const updated = await this.db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.email, email.trim().toLowerCase()))
      .returning({ id: users.id });
    return updated.length > 0;
  }

  /**
   * Disables the account and removes its sessions and tracker tokens, in one transaction.
   * Access tokens already issued are JWTs: the API refuses them through `statusOf`.
   */
  async disable(userId: string, at: Date): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.update(users).set({ disabledAt: at, updatedAt: at }).where(eq(users.id, userId));
      await tx.delete(sessions).where(eq(sessions.userId, userId));
      await tx.delete(oauthAccessTokens).where(eq(oauthAccessTokens.userId, userId));
      await tx.delete(oauthRefreshTokens).where(eq(oauthRefreshTokens.userId, userId));
    });
  }

  async enable(userId: string): Promise<void> {
    await this.db
      .update(users)
      .set({ disabledAt: null, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}
