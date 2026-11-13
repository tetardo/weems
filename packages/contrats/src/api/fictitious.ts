import { z } from "zod";
import { UtcTimestamp } from "./common.ts";

/** Most accounts created by one request (console spec, page Activité simulée). */
export const MAX_FICTITIOUS_PILOTS = 500;

/**
 * Domain of the e-mails of fictitious accounts: never a real address. Their common password
 * (development only) lets anyone log in as one of them on the local site.
 */
export const FICTITIOUS_EMAIL_DOMAIN = "fictif.weems.local";
export const FICTITIOUS_PASSWORD = "weems-fictif";

/** One account to create: its public name, and when it "joined" (before its first flight). */
export const FictitiousPilotRequest = z.object({
  name: z.string().trim().min(1).max(60),
  createdAt: UtcTimestamp,
});
export type FictitiousPilotRequest = z.infer<typeof FictitiousPilotRequest>;

/** POST /v1/dev/fictitious-pilots, outside production only. */
export const FictitiousPilotsRequest = z.object({
  pilots: z.array(FictitiousPilotRequest).min(1).max(MAX_FICTITIOUS_PILOTS),
});
export type FictitiousPilotsRequest = z.infer<typeof FictitiousPilotsRequest>;

/**
 * A fictitious account created. The tracker flies as it with the bearer token
 * `<development token>:<pilotId>` (accepted for fictitious accounts only).
 */
export const FictitiousPilot = z.object({
  pilotId: z.uuid(),
  name: z.string(),
  email: z.string(),
});
export type FictitiousPilot = z.infer<typeof FictitiousPilot>;

export const FictitiousPilotsCreated = z.object({ pilots: z.array(FictitiousPilot) });
export type FictitiousPilotsCreated = z.infer<typeof FictitiousPilotsCreated>;

/**
 * GET /v1/dev/fictitious-pilots: what the fictitious population holds;
 * DELETE /v1/dev/fictitious-pilots: what was deleted.
 */
export const FictitiousPopulation = z.object({
  accounts: z.number().int().nonnegative(),
  publicProfiles: z.number().int().nonnegative(),
  flights: z.number().int().nonnegative(),
  /** Address of the public profile with the most flights (link of the console); null if none. */
  busiestHandle: z.string().nullable(),
  /** The fictitious accounts, for the live activity to fly as them. */
  pilotIds: z.array(z.uuid()),
});
export type FictitiousPopulation = z.infer<typeof FictitiousPopulation>;
