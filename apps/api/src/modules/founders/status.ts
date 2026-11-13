import { FOUNDER_OFFER, type FounderPlace, type FounderStatus } from "@weems/contrats";
import type { FounderRecord } from "./repository.ts";

const REVIEW_MS = FOUNDER_OFFER.reviewHours * 3_600_000;

/** End of the delay during which the console can refuse a new founder. */
export const confirmsAt = (record: FounderRecord) =>
  new Date(record.qualifiedAt.getTime() + REVIEW_MS);

/** Refused, confirmed (by the console or at the end of the delay), or still pending. */
export function statusOf(record: FounderRecord, now: Date): FounderStatus {
  if (record.refusedAt) return "refused";
  if (record.confirmedAt || confirmsAt(record) <= now) return "confirmed";
  return "pending";
}

export function placeOf(record: FounderRecord, now: Date): FounderPlace {
  return {
    number: record.number,
    status: statusOf(record, now),
    qualifiedAt: record.qualifiedAt.toISOString(),
    confirmsAt: confirmsAt(record).toISOString(),
  };
}
