import { uuidV7 } from "@weems/contrats";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import {
  accounts,
  invitations,
  oauthClientResources,
  oauthClients,
  oauthResources,
  users,
} from "../../db/schema.ts";

export interface InvitationRecord {
  code: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
}

/** A first-party OAuth client, written directly: the library only creates clients for a signed-in user. */
export interface FirstPartyClient {
  clientId: string;
  name: string;
  redirectUris: string[];
  scopes: string[];
  /** The API, audience of its access tokens. */
  resource: string;
}

/** What other pilots may know of an account: its public name and when it was created. */
export interface AccountStatus {
  role: string;
  disabledAt: Date | null;
  fictitious: boolean;
}

export interface PilotIdentity {
  name: string;
  createdAt: Date;
  fictitious: boolean;
}

export interface DevPilot {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

/** Invitations, the tracker's OAuth client and the development pilot. Accounts themselves belong to Better Auth. */
export class AccountsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async insertInvitation(
    invitation: Pick<InvitationRecord, "code" | "email" | "role" | "expiresAt">,
  ): Promise<InvitationRecord> {
    const [row] = await this.db.insert(invitations).values(invitation).returning();
    if (!row) throw new Error("Invitation not inserted.");
    return row;
  }

  /** Invitations not used yet, expired ones included, newest first. */
  async openInvitations(): Promise<InvitationRecord[]> {
    return this.db
      .select()
      .from(invitations)
      .where(isNull(invitations.usedAt))
      .orderBy(desc(invitations.createdAt));
  }

  /** Deletes an invitation not used yet. Returns it, or null when there is none. */
  async deleteOpenInvitation(code: string): Promise<InvitationRecord | null> {
    const [row] = await this.db
      .delete(invitations)
      .where(and(eq(invitations.code, code), isNull(invitations.usedAt)))
      .returning();
    return row ?? null;
  }

  async userIdByEmail(email: string): Promise<string | null> {
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(sql`lower(${users.email})`, email.toLowerCase()));
    return row?.id ?? null;
  }

  async findInvitation(code: string): Promise<InvitationRecord | null> {
    const [row] = await this.db.select().from(invitations).where(eq(invitations.code, code));
    return row ?? null;
  }

  /**
   * Marks as used the open invitations of this e-mail (called once the account exists)
   * and gives the account the role of the invitation.
   */
  async markInvitationUsed(email: string): Promise<void> {
    const sameEmail = (column: typeof invitations.email | typeof users.email) =>
      eq(sql`lower(${column})`, email.toLowerCase());
    await this.db.transaction(async (tx) => {
      const used = await tx
        .update(invitations)
        .set({ usedAt: new Date() })
        .where(and(sameEmail(invitations.email), isNull(invitations.usedAt)))
        .returning({ role: invitations.role });
      if (used.some((invitation) => invitation.role === "admin")) {
        await tx.update(users).set({ role: "admin" }).where(sameEmail(users.email));
      }
    });
  }

  /** Creates the client and its link to the API resource if missing; never modifies an existing one. */
  async ensureFirstPartyClient(client: FirstPartyClient): Promise<void> {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      await tx
        .insert(oauthResources)
        .values({
          id: uuidV7(),
          identifier: client.resource,
          name: "Weems API",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
      await tx
        .insert(oauthClients)
        .values({
          id: uuidV7(),
          clientId: client.clientId,
          name: client.name,
          redirectUris: client.redirectUris,
          scopes: client.scopes,
          tokenEndpointAuthMethod: "none",
          applicationType: "native",
          grantTypes: ["authorization_code", "refresh_token"],
          responseTypes: ["code"],
          skipConsent: true,
          requirePKCE: true,
          disabled: false,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
      // Also when the client already exists: the API's address (the resource) may have changed.
      const link = and(
        eq(oauthClientResources.clientId, client.clientId),
        eq(oauthClientResources.resourceId, client.resource),
      );
      const linked = await tx
        .select({ id: oauthClientResources.id })
        .from(oauthClientResources)
        .where(link);
      if (linked.length > 0) return;
      await tx.insert(oauthClientResources).values({
        id: uuidV7(),
        clientId: client.clientId,
        resourceId: client.resource,
        createdAt: now,
      });
    });
  }

  /** Development only: the fixed pilot of the development token, with a password to log in on the site. */
  async ensureDevPilot(pilot: DevPilot): Promise<void> {
    const now = new Date();
    await this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({ id: pilot.id, name: pilot.name, email: pilot.email, emailVerified: true })
        .onConflictDoNothing()
        .returning({ id: users.id });
      if (inserted.length === 0) return;
      await tx.insert(accounts).values({
        id: pilot.id,
        accountId: pilot.id,
        providerId: "credential",
        userId: pilot.id,
        password: pilot.passwordHash,
        updatedAt: now,
      });
    });
  }

  async statusOf(userId: string): Promise<AccountStatus | null> {
    const [row] = await this.db
      .select({ role: users.role, disabledAt: users.disabledAt, fictitious: users.fictitious })
      .from(users)
      .where(eq(users.id, userId));
    return row ?? null;
  }

  async findPilot(pilotId: string): Promise<PilotIdentity | null> {
    const [row] = await this.db
      .select({ name: users.name, createdAt: users.createdAt, fictitious: users.fictitious })
      .from(users)
      .where(eq(users.id, pilotId));
    return row ?? null;
  }
}
