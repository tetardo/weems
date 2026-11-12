import { z } from "zod";

const Count = z.number().int().nonnegative();

/** GET /v1/stats: the counters of the home page (spec J4 accueil). Public, no account. */
export const SiteStats = z.object({
  /** Accounts that are not disabled. */
  pilots: Count,
  /** Every flight recorded by the API. */
  flights: Count,
  /** Flights on the live map right now. */
  liveFlights: Count,
});
export type SiteStats = z.infer<typeof SiteStats>;
