import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "../../db/client.ts";
import {
  ambassadors,
  offerCampaigns,
  offerCodes,
  offerRedemptions,
  users,
} from "../../db/schema.ts";

export interface CampaignRecord {
  id: string;
  kind: string;
  label: string;
  code: string | null;
  months: number;
  places: number | null;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
}

export interface SingleCodeRecord {
  code: string;
  campaignId: string;
  ownerId: string | null;
  expiresAt: Date | null;
  usedAt: Date | null;
}

export interface OwnedCode extends SingleCodeRecord {
  usedBy: string | null;
}

/** Why a redemption did not happen (the transaction left everything as it was). */
export type RedeemRefusal = "already" | "used" | "full";

class Refused extends Error {
  readonly reason: RedeemRefusal;
  constructor(reason: RedeemRefusal) {
    super(reason);
    this.reason = reason;
  }
}

const campaignColumns = {
  id: offerCampaigns.id,
  kind: offerCampaigns.kind,
  label: offerCampaigns.label,
  code: offerCampaigns.code,
  months: offerCampaigns.months,
  places: offerCampaigns.places,
  expiresAt: offerCampaigns.expiresAt,
  cancelledAt: offerCampaigns.cancelledAt,
  createdAt: offerCampaigns.createdAt,
};

const codeColumns = {
  code: offerCodes.code,
  campaignId: offerCodes.campaignId,
  ownerId: offerCodes.ownerId,
  expiresAt: offerCodes.expiresAt,
  usedAt: offerCodes.usedAt,
};

/** Campaigns, single codes and who used them (tables offer_campaigns, offer_codes, offer_redemptions). */
export class OffersRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async campaign(id: string): Promise<CampaignRecord | null> {
    const [row] = await this.db
      .select(campaignColumns)
      .from(offerCampaigns)
      .where(eq(offerCampaigns.id, id));
    return row ?? null;
  }

  async campaignByCode(code: string): Promise<CampaignRecord | null> {
    const [row] = await this.db
      .select(campaignColumns)
      .from(offerCampaigns)
      .where(eq(offerCampaigns.code, code));
    return row ?? null;
  }

  async singleCode(code: string): Promise<SingleCodeRecord | null> {
    const [row] = await this.db
      .select(codeColumns)
      .from(offerCodes)
      .where(eq(offerCodes.code, code));
    return row ?? null;
  }

  async insertCampaign(campaign: CampaignRecord): Promise<void> {
    await this.db.insert(offerCampaigns).values(campaign).onConflictDoNothing();
  }

  async updateCampaign(id: string, changes: Partial<Omit<CampaignRecord, "id">>): Promise<void> {
    await this.db.update(offerCampaigns).set(changes).where(eq(offerCampaigns.id, id));
  }

  async insertCodes(
    codes: (Omit<SingleCodeRecord, "usedAt"> & { createdAt: Date })[],
  ): Promise<void> {
    if (codes.length > 0) await this.db.insert(offerCodes).values(codes);
  }

  /** Places used of a campaign: one per account. */
  async used(campaignId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(offerRedemptions)
      .where(eq(offerRedemptions.campaignId, campaignId));
    return row?.n ?? 0;
  }

  /**
   * Records that the pilot used the campaign (and the single code), in one transaction with the
   * campaign row locked: a full shared code or a used single code is never used twice.
   */
  async redeem(
    campaign: Pick<CampaignRecord, "id" | "places">,
    pilotId: string,
    code: string,
    at: Date,
  ): Promise<RedeemRefusal | null> {
    try {
      await this.db.transaction(async (tx) => {
        await tx
          .select({ id: offerCampaigns.id })
          .from(offerCampaigns)
          .where(eq(offerCampaigns.id, campaign.id))
          .for("update");
        const inserted = await tx
          .insert(offerRedemptions)
          .values({ campaignId: campaign.id, pilotId, code, redeemedAt: at })
          .onConflictDoNothing()
          .returning({ code: offerRedemptions.code });
        if (inserted.length === 0) throw new Refused("already");
        if (campaign.places === null) {
          const marked = await tx
            .update(offerCodes)
            .set({ usedBy: pilotId, usedAt: at })
            .where(and(eq(offerCodes.code, code), isNull(offerCodes.usedAt)))
            .returning({ code: offerCodes.code });
          if (marked.length === 0) throw new Refused("used");
          return;
        }
        const [row] = await tx
          .select({ n: count() })
          .from(offerRedemptions)
          .where(eq(offerRedemptions.campaignId, campaign.id));
        if ((row?.n ?? 0) > campaign.places) throw new Refused("full");
      });
      return null;
    } catch (error) {
      if (error instanceof Refused) return error.reason;
      throw error;
    }
  }

  /** Referral codes given to a founder, with the name of the pilot who used each. */
  async ownedBy(ownerId: string): Promise<OwnedCode[]> {
    return this.db
      .select({ ...codeColumns, usedBy: users.name })
      .from(offerCodes)
      .leftJoin(users, eq(users.id, offerCodes.usedBy))
      .where(eq(offerCodes.ownerId, ownerId))
      .orderBy(offerCodes.createdAt, offerCodes.code);
  }

  /** The founder's unused codes stop working now. */
  async expireUnusedOf(ownerId: string, at: Date): Promise<void> {
    await this.db
      .update(offerCodes)
      .set({ expiresAt: at })
      .where(and(eq(offerCodes.ownerId, ownerId), isNull(offerCodes.usedAt)));
  }

  async codesOf(campaignId: string): Promise<OwnedCode[]> {
    return this.db
      .select({ ...codeColumns, usedBy: users.name })
      .from(offerCodes)
      .leftJoin(users, eq(users.id, offerCodes.usedBy))
      .where(eq(offerCodes.campaignId, campaignId))
      .orderBy(offerCodes.code);
  }

  /** Every campaign, newest first, with its use and the ambassador it belongs to. */
  async listCampaigns(): Promise<
    (CampaignRecord & { used: number; codes: number; ambassador: string | null })[]
  > {
    const [campaigns, used, codes, owners] = await Promise.all([
      this.db.select(campaignColumns).from(offerCampaigns).orderBy(desc(offerCampaigns.createdAt)),
      this.countBy(offerRedemptions, offerRedemptions.campaignId),
      this.countBy(offerCodes, offerCodes.campaignId),
      this.db.select({ id: ambassadors.campaignId, slug: ambassadors.slug }).from(ambassadors),
    ]);
    const slugs = new Map(owners.map((owner) => [owner.id, owner.slug]));
    return campaigns.map((campaign) => ({
      ...campaign,
      used: used.get(campaign.id) ?? 0,
      codes: codes.get(campaign.id) ?? 0,
      ambassador: slugs.get(campaign.id) ?? null,
    }));
  }

  private async countBy(
    table: typeof offerRedemptions | typeof offerCodes,
    column: typeof offerRedemptions.campaignId | typeof offerCodes.campaignId,
  ): Promise<Map<string, number>> {
    const rows = await this.db.select({ id: column, n: count() }).from(table).groupBy(column);
    return new Map(rows.map((row) => [row.id, row.n]));
  }
}
