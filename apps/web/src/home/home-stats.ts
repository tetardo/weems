import type { SiteStats } from "@weems/contrats";
import { getSiteStats } from "../api/public-api.ts";

/**
 * Counters of the home page. The home must show even when the API is down or busy: the board then
 * shows dashes instead of numbers.
 */
export async function homeStats(): Promise<SiteStats | null> {
  try {
    return await getSiteStats();
  } catch {
    return null;
  }
}
