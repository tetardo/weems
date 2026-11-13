import { z } from "zod";
import { FlightId, IcaoCode, UtcTimestamp } from "./common.ts";
import { FlightValidity } from "./flight-validity.ts";

/**
 * Pilot ranks (spec web grades des pilotes): 9 invented names, in 3 tiers of 3. A rank needs both
 * thresholds, valid hours and valid flights, so neither a long autopilot flight nor a series of
 * circuits is enough on its own. A rank is never lost.
 */
export const PilotRank = z.enum([
  "student",
  "cadet",
  "flyer",
  "officer",
  "firstOfficer",
  "captain",
  "seniorCaptain",
  "chiefPilot",
  "legend",
]);
export type PilotRank = z.infer<typeof PilotRank>;

/** Valid hours and valid flights needed for a rank. */
export interface RankThreshold {
  hours: number;
  flights: number;
}

/** In the order of PilotRank. */
export const RANK_THRESHOLDS: Readonly<Record<PilotRank, RankThreshold>> = {
  student: { hours: 0, flights: 0 },
  cadet: { hours: 5, flights: 3 },
  flyer: { hours: 20, flights: 10 },
  officer: { hours: 50, flights: 25 },
  firstOfficer: { hours: 100, flights: 50 },
  captain: { hours: 250, flights: 100 },
  seniorCaptain: { hours: 500, flights: 200 },
  chiefPilot: { hours: 1000, flights: 350 },
  legend: { hours: 2500, flights: 700 },
};

/** Ranks come in 3 tiers of 3 (bronze, silver, gold on the insignia). */
export const RANKS_PER_TIER = 3;

/** Position of the rank, 0 (student) to 8 (legend). */
export function rankIndex(rank: PilotRank): number {
  return PilotRank.options.indexOf(rank);
}

/** Tier 0, 1 or 2, and step 0, 1 or 2 inside the tier: what the insignia draws. */
export function rankTier(rank: PilotRank): { tier: number; step: number } {
  const index = rankIndex(rank);
  return { tier: Math.floor(index / RANKS_PER_TIER), step: index % RANKS_PER_TIER };
}

/** Rank shown publicly (profile, Boarding). reachedAt is null for the first rank. */
export const PublicRank = z.object({
  rank: PilotRank,
  reachedAt: UtcTimestamp.nullable(),
});
export type PublicRank = z.infer<typeof PublicRank>;

/** One recent flight and what it brought to the rank. */
export const RankFlight = z.object({
  flightId: FlightId,
  openedAt: UtcTimestamp,
  departureIcao: IcaoCode.nullable(),
  arrivalIcao: IcaoCode.nullable(),
  aircraftTitle: z.string(),
  /** Airborne hours counted (real time, pauses excluded); 0 when not valid. */
  countedHours: z.number().nonnegative(),
  /** Same rules as the founders offer (flights/validity.ts of the API). */
  validity: FlightValidity,
});
export type RankFlight = z.infer<typeof RankFlight>;

/** Flights listed on the card of the logbook. */
export const RANK_RECENT_FLIGHTS = 5;

/** GET /v1/me/rank: card « Votre grade » of the private logbook. */
export const MyRank = PublicRank.extend({
  validHours: z.number().nonnegative(),
  validFlights: z.number().int().nonnegative(),
  /** Airborne hours of every closed flight, valid or not. */
  totalHours: z.number().nonnegative(),
  /** null at the last rank. */
  next: z.object({ rank: PilotRank, hours: z.number(), flights: z.number().int() }).nullable(),
  recentFlights: z.array(RankFlight).max(RANK_RECENT_FLIGHTS),
});
export type MyRank = z.infer<typeof MyRank>;
