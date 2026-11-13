import { SiteStats } from "@weems/contrats";
import type { SiteNumbers } from "./launcher-state.ts";

const TIMEOUT_MS = 3_000;

/** The site's counters, read from the local API (public route, cached 30 s by the API). */
export async function readSiteStats(apiUrl: string): Promise<SiteNumbers | null> {
  try {
    const response = await fetch(`${apiUrl}/v1/stats`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return null;
    return SiteStats.parse(await response.json());
  } catch {
    return null;
  }
}
