import {
  type AdminCampaigns,
  FOUNDER_OFFER,
  type MyCodes,
  type NewCodeBatch,
  type RedeemResult,
  uuidV7,
} from "@weems/contrats";
import { ApiProblem, conflict, notFound } from "../../plugins/problem.ts";
import type { PlansService } from "../plans/service.ts";
import { canonicalCode, isSingleCode, newSingleCode } from "./codes.ts";
import type { CampaignRecord, OffersRepository, RedeemRefusal } from "./repository.ts";

/** The single campaign that holds every founder's referral codes (fixed id). */
const REFERRAL_CAMPAIGN_ID = "00000000-0000-7000-8000-00000000f0d1";

const DAY_MS = 86_400_000;
const gone = (detail: string) => new ApiProblem(410, "Gone", detail);
const unknownCode = () => notFound("No offer code like this one.");

const REFUSALS: Record<RedeemRefusal, () => ApiProblem> = {
  already: () => conflict("You already used this offer."),
  used: () => gone("This code has already been used."),
  full: () => gone("This code has no place left."),
};

/** A code found, with the campaign it belongs to. */
interface FoundCode {
  code: string;
  campaign: CampaignRecord;
  ownerId: string | null;
  expiresAt: Date | null;
  usedAt: Date | null;
}

/**
 * Offer codes (spec offre fondateurs): batches of single codes for partners, the founders'
 * referral codes and the shared code of each ambassador. A code gives Pilot Pro for its months,
 * once per account; the months add up with the gifts already running.
 */
export class OffersService {
  private readonly repository: OffersRepository;
  private readonly plans: PlansService;
  private readonly now: () => Date;
  private ambassadorNames: (campaignId: string) => Promise<string | null> = () =>
    Promise.resolve(null);

  constructor(
    repository: OffersRepository,
    plans: PlansService,
    now: () => Date = () => new Date(),
  ) {
    this.repository = repository;
    this.plans = plans;
    this.now = now;
  }

  /** Name shown when an ambassador's code is used (set by the ambassadors service). */
  nameAmbassadors(names: (campaignId: string) => Promise<string | null>): void {
    this.ambassadorNames = names;
  }

  async redeem(pilotId: string, typed: string): Promise<RedeemResult> {
    const found = await this.usable(typed);
    if (found.ownerId === pilotId) throw conflict("A referral code is for someone else.");
    const refusal = await this.repository.redeem(found.campaign, pilotId, found.code, this.now());
    if (refusal) throw REFUSALS[refusal]();
    const proUntil = await this.plans.givePro(pilotId, found.campaign.months, "code");
    return {
      months: found.campaign.months,
      proUntil: proUntil.toISOString(),
      ambassador: await this.ambassadorNames(found.campaign.id),
    };
  }

  /** A code that can still be used opens the sign-up during the closed alpha. */
  async opensSignUp(typed: string): Promise<boolean> {
    try {
      await this.usable(typed);
      return true;
    } catch (error) {
      if (error instanceof ApiProblem) return false;
      throw error;
    }
  }

  /** At sign-up: uses the code for the new account, quietly if it no longer works. */
  async redeemAtSignUp(pilotId: string, typed: string): Promise<void> {
    try {
      await this.redeem(pilotId, typed);
    } catch (error) {
      if (!(error instanceof ApiProblem)) throw error;
    }
  }

  async mine(pilotId: string): Promise<MyCodes> {
    const owned = await this.repository.ownedBy(pilotId);
    return {
      referral: owned.map((code) => ({
        code: code.code,
        months: FOUNDER_OFFER.referralMonths,
        expiresAt: (code.expiresAt ?? this.now()).toISOString(),
        usedAt: code.usedAt?.toISOString() ?? null,
        usedBy: code.usedBy,
      })),
    };
  }

  /** The founder's referral codes, valid 90 days. */
  async issueReferral(pilotId: string): Promise<void> {
    const now = this.now();
    await this.repository.insertCampaign({
      id: REFERRAL_CAMPAIGN_ID,
      kind: "referral",
      label: "Parrainage fondateurs",
      code: null,
      months: FOUNDER_OFFER.referralMonths,
      places: null,
      expiresAt: null,
      cancelledAt: null,
      createdAt: now,
    });
    const expiresAt = new Date(now.getTime() + FOUNDER_OFFER.referralValidDays * DAY_MS);
    const codes = Array.from({ length: FOUNDER_OFFER.referralCodes }, () => ({
      code: newSingleCode(),
      campaignId: REFERRAL_CAMPAIGN_ID,
      ownerId: pilotId,
      expiresAt,
      createdAt: now,
    }));
    await this.repository.insertCodes(codes);
  }

  async withdrawReferral(pilotId: string): Promise<void> {
    await this.repository.expireUnusedOf(pilotId, this.now());
  }

  async campaigns(): Promise<AdminCampaigns> {
    const rows = await this.repository.listCampaigns();
    return {
      campaigns: rows.map((row) => ({
        id: row.id,
        kind: row.kind === "shared" || row.kind === "referral" ? row.kind : "batch",
        label: row.label,
        months: row.months,
        code: row.code,
        size: row.places ?? row.codes,
        used: row.used,
        expiresAt: row.expiresAt?.toISOString() ?? null,
        cancelledAt: row.cancelledAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        ambassador: row.ambassador,
      })),
    };
  }

  /** A batch of single codes for a partner. */
  async createBatch(batch: NewCodeBatch): Promise<string> {
    const now = this.now();
    const id = uuidV7();
    const { label, months, count, expiresAt } = batch;
    await this.repository.insertCampaign({
      id,
      kind: "batch",
      label,
      code: null,
      months,
      places: null,
      expiresAt: new Date(expiresAt),
      cancelledAt: null,
      createdAt: now,
    });
    const codes = new Set<string>();
    while (codes.size < count) codes.add(newSingleCode());
    await this.repository.insertCodes(
      [...codes].map((code) => ({
        code,
        campaignId: id,
        ownerId: null,
        expiresAt: null,
        createdAt: now,
      })),
    );
    return id;
  }

  /** The codes of a batch as a CSV file: code, used at, used by. */
  async csv(campaignId: string): Promise<string> {
    if (!(await this.repository.campaign(campaignId))) throw notFound("No such campaign.");
    const codes = await this.repository.codesOf(campaignId);
    const quoted = (value: string | null) => `"${(value ?? "").replaceAll('"', '""')}"`;
    const lines = codes.map((code) =>
      [code.code, code.usedAt?.toISOString() ?? null, code.usedBy].map(quoted).join(","),
    );
    return ["code,used_at,used_by", ...lines].join("\n") + "\n";
  }

  /** The codes not used yet stop working; Pilot Pro already given stays. */
  async cancel(campaignId: string): Promise<void> {
    const campaign = await this.repository.campaign(campaignId);
    if (!campaign) throw notFound("No such campaign.");
    if (!campaign.cancelledAt)
      await this.repository.updateCampaign(campaignId, { cancelledAt: this.now() });
  }

  /** Shared campaign of an ambassador: created or changed with their settings. */
  async saveShared(
    id: string | null,
    offer: { label: string; code: string; months: number; places: number; expiresAt: Date },
    active: boolean,
  ): Promise<string> {
    const cancelledAt = active ? null : this.now();
    const fields = { ...offer, cancelledAt };
    const owner = await this.repository.campaignByCode(offer.code);
    if (owner && owner.id !== id) throw conflict(`The code ${offer.code} is already taken.`);
    if (id) {
      await this.repository.updateCampaign(id, fields);
      return id;
    }
    const created = uuidV7();
    await this.repository.insertCampaign({
      id: created,
      kind: "shared",
      ...fields,
      createdAt: this.now(),
    });
    return created;
  }

  async used(campaignId: string): Promise<number> {
    return this.repository.used(campaignId);
  }

  async campaign(campaignId: string): Promise<CampaignRecord | null> {
    return this.repository.campaign(campaignId);
  }

  /** The code exists, its campaign runs, it has not expired: or the problem to answer. */
  private async usable(typed: string): Promise<FoundCode> {
    const found = await this.find(canonicalCode(typed));
    if (!found) throw unknownCode();
    const expiresAt = found.expiresAt ?? found.campaign.expiresAt;
    if (found.campaign.cancelledAt) throw gone("This offer has ended.");
    if (expiresAt && expiresAt <= this.now()) throw gone("This code has expired.");
    if (found.usedAt) throw gone("This code has already been used.");
    const { places } = found.campaign;
    if (places !== null && (await this.repository.used(found.campaign.id)) >= places) {
      throw gone("This code has no place left.");
    }
    return found;
  }

  private async find(code: string): Promise<FoundCode | null> {
    if (isSingleCode(code)) {
      const single = await this.repository.singleCode(code);
      const campaign = single && (await this.repository.campaign(single.campaignId));
      return single && campaign ? { ...single, campaign } : null;
    }
    const campaign = await this.repository.campaignByCode(code);
    return campaign && { code, campaign, ownerId: null, expiresAt: null, usedAt: null };
  }
}
