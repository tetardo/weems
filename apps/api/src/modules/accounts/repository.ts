import { uuidV7 } from "@weems/contrats";
import { and, eq, isNull, sql } from "drizzle-orm";
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

  async insertInvitation(code: string, email: string): Promise<void> {
    await this.db.insert(invitations).values({ code, email });
  }

  async findInvitation(code: string): Promise<InvitationRecord | null> {
    const [row] = await this.db.select().from(invitations).where(eq(invitations.code, code));
    return row ?? null;
  }

  /** Marks as used the open invitation of this e-mail (called once the account exists). */
  async markInvitationUsed(email: string): Promise<void> {
    await this.db
      .update(invitations)
      .set({ usedAt: new Date() })
      .where(
        and(eq(sql`lower(${invitations.email})`, email.toLowerCase()), isNull(invitations.usedAt)),
      );
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
}
