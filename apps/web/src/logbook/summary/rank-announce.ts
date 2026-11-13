import { type PilotRank, rankIndex } from "@weems/contrats";

/** Last rank announced to the pilot in this browser. */
export const RANK_SEEN_STORAGE_KEY = "weems-rank-seen";

/** A browser that never announced a rank shows one reached this recently. */
export const ANNOUNCE_RECENT_MS = 7 * 86_400_000;

/**
 * Whether the window « Nouveau grade » opens: a rank above the last one announced here, or, on a
 * browser that announced nothing yet, a rank reached in the last days. Never for the first rank.
 */
export function shouldAnnounce(
  seen: string | null,
  rank: PilotRank,
  reachedAt: string | null,
  nowMs: number,
): boolean {
  if (reachedAt === null || rank === "student") return false;
  const known = seen === null ? -1 : rankIndex(seen as PilotRank);
  if (known >= 0) return rankIndex(rank) > known;
  return nowMs - Date.parse(reachedAt) < ANNOUNCE_RECENT_MS;
}
