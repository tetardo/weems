import { z } from "zod";
import { UtcTimestamp } from "./common.ts";

/**
 * Offer codes (spec offre fondateurs): each gives Pilot Pro for some months, once per account.
 * - single: one code per pilot, WEEMS-XXXX-XXXX (batches made in the console, referral codes of
 *   the founders);
 * - shared: one code for a public (an ambassador's), with a number of places.
 * A sign-up may carry an offer code instead of an invitation: it then opens the closed alpha.
 */
export const CampaignKind = z.enum(["batch", "referral", "shared"]);
export type CampaignKind = z.infer<typeof CampaignKind>;

/** Readable on a screen or over the phone: no 0/O, 1/I/L (same alphabet as the invitations). */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const SINGLE_CODE_PATTERN = /^WEEMS-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;
/** Code of an ambassador: 4 to 20 capitals, digits or dashes, never starting with WEEMS. */
export const SharedCode = z
  .string()
  .regex(/^(?!WEEMS)[A-Z0-9][A-Z0-9-]{2,18}[A-Z0-9]$/, "4 to 20 of A-Z, 0-9 and -, not WEEMS…");
export type SharedCode = z.infer<typeof SharedCode>;

export const OfferMonths = z.number().int().min(1).max(24);

/** Most attempts at a code per visitor address and hour (guessing a code). */
export const REDEEM_ATTEMPTS_PER_HOUR = 5;

/** POST /v1/me/codes/redeem */
export const RedeemCode = z.object({ code: z.string().trim().min(4).max(40) });
export type RedeemCode = z.infer<typeof RedeemCode>;

/** What a code gave. */
export const RedeemResult = z.object({
  months: OfferMonths,
  /** End of Pilot Pro given by codes and offers, this one included. */
  proUntil: UtcTimestamp,
  /** Ambassador whose code it was, if any. */
  ambassador: z.string().nullable(),
});
export type RedeemResult = z.infer<typeof RedeemResult>;

/** A referral code of a founder, as they see it. */
export const ReferralCode = z.object({
  code: z.string(),
  months: OfferMonths,
  expiresAt: UtcTimestamp,
  usedAt: UtcTimestamp.nullable(),
  /** Public name of the pilot who used it. */
  usedBy: z.string().nullable(),
});
export type ReferralCode = z.infer<typeof ReferralCode>;

/** GET /v1/me/codes: the caller's codes to give away. */
export const MyCodes = z.object({ referral: z.array(ReferralCode) });
export type MyCodes = z.infer<typeof MyCodes>;

/** A batch, the referral codes or an ambassador's code, in the console. */
export const AdminCampaign = z.object({
  id: z.uuid(),
  kind: CampaignKind,
  label: z.string(),
  months: OfferMonths,
  /** Shared code only. */
  code: z.string().nullable(),
  /** Codes made (batch, referral) or places (shared). */
  size: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  expiresAt: UtcTimestamp.nullable(),
  cancelledAt: UtcTimestamp.nullable(),
  createdAt: UtcTimestamp,
  ambassador: z.string().nullable(),
});
export type AdminCampaign = z.infer<typeof AdminCampaign>;

/** GET /v1/admin/codes */
export const AdminCampaigns = z.object({ campaigns: z.array(AdminCampaign) });
export type AdminCampaigns = z.infer<typeof AdminCampaigns>;

/** POST /v1/admin/codes/batches: single-use codes for a partner. */
export const NewCodeBatch = z.object({
  label: z.string().trim().min(2).max(80),
  months: OfferMonths,
  count: z.number().int().min(1).max(500),
  expiresAt: UtcTimestamp,
});
export type NewCodeBatch = z.infer<typeof NewCodeBatch>;
