import type { GrantRecord } from "./repository-grants.ts";

/** Same day of the month `months` later, UTC (31 January + 1 month: 3 March, as Date does). */
export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

/**
 * The gift running at `now` and the end of the gifts that follow it without a gap; null when
 * none runs. `grants`: not revoked, ending after `now`, earliest start first.
 */
export function runningGift(
  grants: readonly GrantRecord[],
  now: Date,
): { current: GrantRecord; until: Date } | null {
  const current = grants.find((grant) => grant.startsAt <= now && grant.endsAt > now);
  if (!current) return null;
  let until = current.endsAt;
  for (const grant of grants) {
    if (grant.startsAt <= until && grant.endsAt > until) until = grant.endsAt;
  }
  return { current, until };
}

/** Where a new gift starts: now, or at the end of the gifts already given (they add up). */
export function nextGiftStart(grants: readonly GrantRecord[], now: Date): Date {
  return grants.reduce((start, grant) => (grant.endsAt > start ? grant.endsAt : start), now);
}
