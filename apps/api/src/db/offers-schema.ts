import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema.ts";
import { bytea } from "./bytea.ts";

/** Tables of the founder offer and of the offer codes (spec offre fondateurs). */

const utc = (name: string) => timestamp(name, { withTimezone: true, precision: 3, mode: "date" });

/**
 * Plans given without payment (founder offer, offer codes, console): one row per gift. A gift
 * given while another runs starts at its end. Refusing a founder sets revoked_at.
 */
export const planGrants = pgTable(
  "plan_grants",
  {
    id: uuid("id").primaryKey(),
    pilotId: uuid("pilot_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: text("plan").notNull(),
    /** "founder", "code" or "admin". */
    source: text("source").notNull(),
    startsAt: utc("starts_at").notNull(),
    endsAt: utc("ends_at").notNull(),
    revokedAt: utc("revoked_at"),
    createdAt: utc("created_at").notNull(),
  },
  (table) => [index("plan_grants_pilot_idx").on(table.pilotId, table.endsAt)],
);

/** Founder numbers: never given twice, even after a refusal or a deleted account. */
export const founderNumbers = pgSequence("founder_number_seq", { startWith: 1 });

/** One row per founder place, kept after a refusal (the number stays burnt). */
export const founders = pgTable("founders", {
  number: integer("number")
    .primaryKey()
    .default(sql`nextval('founder_number_seq')`),
  pilotId: uuid("pilot_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  qualifiedAt: utc("qualified_at").notNull(),
  /** Confirmed early from the console; otherwise confirmed at the end of the review delay. */
  confirmedAt: utc("confirmed_at"),
  refusedAt: utc("refused_at"),
});

/** A batch of single codes, the referral codes, or the shared code of an ambassador. */
export const offerCampaigns = pgTable("offer_campaigns", {
  id: uuid("id").primaryKey(),
  /** "batch", "referral" or "shared". */
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  /** Shared code only (an ambassador's). */
  code: text("code").unique(),
  months: integer("months").notNull(),
  /** Places of a shared code; null for single codes (one place each). */
  places: integer("places"),
  expiresAt: utc("expires_at"),
  cancelledAt: utc("cancelled_at"),
  createdAt: utc("created_at").notNull(),
});

/** Single-use codes (WEEMS-XXXX-XXXX). */
export const offerCodes = pgTable(
  "offer_codes",
  {
    code: text("code").primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => offerCampaigns.id),
    /** Founder who received it to give away (referral). */
    ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
    /** Referral codes expire on their own; batch codes with their campaign. */
    expiresAt: utc("expires_at"),
    usedBy: uuid("used_by").references(() => users.id, { onDelete: "set null" }),
    usedAt: utc("used_at"),
    createdAt: utc("created_at").notNull(),
  },
  (table) => [
    index("offer_codes_campaign_idx").on(table.campaignId),
    index("offer_codes_owner_idx").on(table.ownerId),
  ],
);

/** Who used which campaign: once per account and campaign. */
export const offerRedemptions = pgTable(
  "offer_redemptions",
  {
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => offerCampaigns.id),
    pilotId: uuid("pilot_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    redeemedAt: utc("redeemed_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.campaignId, table.pilotId] })],
);

/** Public page of an ambassador, tied to their shared code. */
export const ambassadors = pgTable("ambassadors", {
  slug: text("slug").primaryKey(),
  campaignId: uuid("campaign_id")
    .notNull()
    .unique()
    .references(() => offerCampaigns.id),
  /** name, tagline, bioFr, bioEn, quoteFr, quoteEn, links (AmbassadorContent). */
  content: jsonb("content").notNull(),
  pilotId: uuid("pilot_id").references(() => users.id, { onDelete: "set null" }),
  active: boolean("active").notNull(),
  /** Square, 256 px, WebP. */
  photo: bytea("photo"),
  updatedAt: utc("updated_at").notNull(),
});
