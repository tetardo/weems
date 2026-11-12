import { and, count, isNull, lt } from "drizzle-orm";
import { invitations, sessions } from "../../db/auth-schema.ts";
import type { Database } from "../../db/client.ts";

/** Expired sessions: the login is over, the row only takes room. */
const expiredSessions = (now: Date) => lt(sessions.expiresAt, now);

/** Invitations never used whose 14 days have passed: their link no longer opens an account. */
const expiredInvitations = (now: Date) =>
  and(isNull(invitations.usedAt), lt(invitations.expiresAt, now));

/** Cleanup of the page Base de données (spec admin): what the accounts no longer need. */
export class AccountsCleanupRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async countExpired(now: Date): Promise<{ sessions: number; invitations: number }> {
    const [[s], [i]] = await Promise.all([
      this.db.select({ n: count() }).from(sessions).where(expiredSessions(now)),
      this.db.select({ n: count() }).from(invitations).where(expiredInvitations(now)),
    ]);
    return { sessions: s?.n ?? 0, invitations: i?.n ?? 0 };
  }

  async deleteExpiredSessions(now: Date): Promise<number> {
    const rows = await this.db
      .delete(sessions)
      .where(expiredSessions(now))
      .returning({ id: sessions.id });
    return rows.length;
  }

  async deleteExpiredInvitations(now: Date): Promise<number> {
    const rows = await this.db
      .delete(invitations)
      .where(expiredInvitations(now))
      .returning({ code: invitations.code });
    return rows.length;
  }
}
