import { z } from "zod";
import { FlightId, IcaoCode, UtcTimestamp } from "./common.ts";
import { FlightValidity } from "./flight-validity.ts";
import { LivePilot } from "./live.ts";

/**
 * Offer « Pilote fondateur » (spec offre fondateurs): the first 500 pilots who fly for real get
 * Pilot Pro for a year and a founder number kept for life. One place per pilot; a place given
 * back after a refusal frees a place, never its number.
 */
export const FOUNDER_OFFER = {
  places: 500,
  /** Pilot Pro given to a founder, in months. */
  months: 12,
  requiredFlights: 3,
  /** Distinct UTC days among the valid flights. */
  requiredDays: 2,
  /** A new founder can be refused from the console during this delay, then is confirmed. */
  reviewHours: 48,
  /** Single-use codes each founder receives to give away (referral). */
  referralCodes: 3,
  referralMonths: 3,
  /** Days a referral code stays valid after it is made. */
  referralValidDays: 90,
  /** Discount on Pilot Pro kept by a founder after the free year, once payment exists. */
  discountPercent: 30,
  /** The site shows « X places left » only below this many places. */
  showRemainingBelow: 100,
} as const;

export const FounderFlight = z.object({
  flightId: FlightId,
  departureIcao: IcaoCode.nullable(),
  arrivalIcao: IcaoCode.nullable(),
  aircraftTitle: z.string(),
  openedAt: UtcTimestamp,
  airborneS: z.number().nonnegative().nullable(),
  distanceNm: z.number().nonnegative().nullable(),
  /** Valid flight rules shared with the pilot grades (flight-validity.ts). */
  check: FlightValidity,
});
export type FounderFlight = z.infer<typeof FounderFlight>;

/** pending: can still be refused (review delay); confirmed: badge shown; refused: place taken back. */
export const FounderStatus = z.enum(["pending", "confirmed", "refused"]);
export type FounderStatus = z.infer<typeof FounderStatus>;

export const FounderPlace = z.object({
  number: z.number().int().positive(),
  status: FounderStatus,
  qualifiedAt: UtcTimestamp,
  /** End of the review delay. */
  confirmsAt: UtcTimestamp,
});
export type FounderPlace = z.infer<typeof FounderPlace>;

/** GET /v1/me/founder: the caller's progress towards a founder place, or their place. */
export const MyFounder = z.object({
  place: FounderPlace.nullable(),
  /** False for accounts that cannot take part (administrators, fictitious accounts). */
  eligible: z.boolean(),
  placesLeft: z.number().int().nonnegative(),
  validFlights: z.number().int().nonnegative(),
  validDays: z.number().int().nonnegative(),
  /** Most recent closed flights first, 10 at most. */
  flights: z.array(FounderFlight),
});
export type MyFounder = z.infer<typeof MyFounder>;

/** GET /v1/founders: public state of the offer, without account. */
export const PublicFounders = z.object({
  places: z.number().int().positive(),
  /** Places taken (confirmed or still in review). */
  taken: z.number().int().nonnegative(),
  placesLeft: z.number().int().nonnegative(),
  /** Confirmed founders, latest first (5 at most); pilot only while their profile is public. */
  latest: z.array(
    z.object({
      number: z.number().int().positive(),
      confirmedAt: UtcTimestamp,
      pilot: LivePilot.nullable(),
    }),
  ),
});
export type PublicFounders = z.infer<typeof PublicFounders>;

/** One founder in the console. */
export const AdminFounder = z.object({
  number: z.number().int().positive(),
  pilotId: z.uuid(),
  /** Null once the account is deleted. */
  name: z.string().nullable(),
  status: FounderStatus,
  qualifiedAt: UtcTimestamp,
  confirmsAt: UtcTimestamp,
  refusedAt: UtcTimestamp.nullable(),
});
export type AdminFounder = z.infer<typeof AdminFounder>;

/** GET /v1/admin/founders */
export const AdminFounders = z.object({
  places: z.number().int().positive(),
  confirmed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  refused: z.number().int().nonnegative(),
  founders: z.array(AdminFounder),
});
export type AdminFounders = z.infer<typeof AdminFounders>;
