import { FOUNDER_OFFER } from "@weems/contrats";

/** « X places left » only once few remain: a large number would say nobody comes (Greg, 13/11). */
export const showPlacesLeft = (placesLeft: number) =>
  placesLeft > 0 && placesLeft < FOUNDER_OFFER.showRemainingBelow;

const DAY_MS = 86_400_000;

/** Whole days until `until`, never negative. */
export function daysUntil(until: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(until) - now) / DAY_MS));
}

/** Segments of the progress meter: one per required flight, filled by the valid ones. */
export const meterSegments = (validFlights: number) =>
  Array.from({ length: FOUNDER_OFFER.requiredFlights }, (_, i) => i < validFlights);
