import { z } from "zod";
import { UtcTimestamp } from "./common.ts";
import { OfferMonths, SharedCode } from "./offer-codes.ts";
import { PilotHandle } from "./profiles.ts";

/** Address of an ambassador's page: /ambassadors/{slug}. */
export const AmbassadorSlug = PilotHandle;

export const AmbassadorLinkKind = z.enum(["twitch", "youtube", "website"]);
export type AmbassadorLinkKind = z.infer<typeof AmbassadorLinkKind>;

export const AmbassadorLink = z.object({
  kind: AmbassadorLinkKind,
  url: z.url({ protocol: /^https$/ }).max(200),
});
export type AmbassadorLink = z.infer<typeof AmbassadorLink>;

/** Photo of an ambassador: square, 256 px, WebP, made by the API from the uploaded image. */
export const AMBASSADOR_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

const Text = (max: number) => z.string().trim().min(1).max(max);

/** What an ambassador's page says, as the console writes it. */
export const AmbassadorContent = z.object({
  name: Text(40),
  tagline: Text(140),
  bioFr: Text(800),
  bioEn: Text(800),
  quoteFr: Text(240).nullable(),
  quoteEn: Text(240).nullable(),
  links: z.array(AmbassadorLink).max(3),
});
export type AmbassadorContent = z.infer<typeof AmbassadorContent>;

/** The offer of an ambassador's code. */
export const AmbassadorOffer = z.object({
  code: SharedCode,
  months: OfferMonths,
  places: z.number().int().min(1).max(10_000),
  expiresAt: UtcTimestamp,
});
export type AmbassadorOffer = z.infer<typeof AmbassadorOffer>;

/** PUT /v1/admin/ambassadors/{slug}: creates or changes an ambassador and their code. */
export const AmbassadorSettings = AmbassadorContent.extend({
  offer: AmbassadorOffer,
  /** Handle of the ambassador's Weems profile, if they have one. */
  pilotHandle: PilotHandle.nullable(),
  /** Off: the page and the code close; Pilot Pro already given stays. */
  active: z.boolean(),
});
export type AmbassadorSettings = z.infer<typeof AmbassadorSettings>;

/** GET /v1/ambassadors/{slug}: public, without account; 404 when unknown or off. */
export const PublicAmbassador = AmbassadorContent.extend({
  slug: AmbassadorSlug,
  /** Photo at GET /v1/ambassadors/{slug}/photo, else the linked profile's, else the initial. */
  hasPhoto: z.boolean(),
  pilotHandle: PilotHandle.nullable(),
  pilotHasPhoto: z.boolean(),
  offer: AmbassadorOffer.extend({
    placesLeft: z.number().int().nonnegative(),
    /** False once full or expired: the page stays, the code no longer works. */
    open: z.boolean(),
  }),
});
export type PublicAmbassador = z.infer<typeof PublicAmbassador>;

/** One ambassador in the console. */
export const AdminAmbassador = AmbassadorSettings.extend({
  slug: AmbassadorSlug,
  hasPhoto: z.boolean(),
  campaignId: z.uuid(),
  used: z.number().int().nonnegative(),
  updatedAt: UtcTimestamp,
});
export type AdminAmbassador = z.infer<typeof AdminAmbassador>;

/** GET /v1/admin/ambassadors */
export const AdminAmbassadors = z.object({ ambassadors: z.array(AdminAmbassador) });
export type AdminAmbassadors = z.infer<typeof AdminAmbassadors>;
