import {
  type FlightValidity,
  type MyRank,
  PilotRank,
  RANK_RECENT_FLIGHTS,
  RANK_THRESHOLDS,
  type RankFlight,
} from "@weems/contrats";

/** What the rank needs of one closed flight. */
export interface RankedFlight {
  flightId: string;
  openedAt: string;
  closedAt: string;
  departureIcao: string | null;
  arrivalIcao: string | null;
  aircraftTitle: string;
  /** Liftoff to last touchdown in real time, pauses excluded; null without both. */
  airborneS: number | null;
  validity: FlightValidity;
}

const hoursOf = (seconds: number) => seconds / 3600;

function reached(rank: PilotRank, hours: number, flights: number): boolean {
  const need = RANK_THRESHOLDS[rank];
  return hours >= need.hours && flights >= need.flights;
}

/** Highest rank met by these totals. */
export function rankFor(hours: number, flights: number): PilotRank {
  return PilotRank.options.findLast((rank) => reached(rank, hours, flights)) ?? "student";
}

function nextOf(rank: PilotRank): MyRank["next"] {
  const next = PilotRank.options[PilotRank.options.indexOf(rank) + 1];
  return next ? { rank: next, ...RANK_THRESHOLDS[next] } : null;
}

function recentLine(flight: RankedFlight): RankFlight {
  const counted = flight.validity === "valid" ? hoursOf(flight.airborneS ?? 0) : 0;
  return {
    flightId: flight.flightId,
    openedAt: flight.openedAt,
    departureIcao: flight.departureIcao,
    arrivalIcao: flight.arrivalIcao,
    aircraftTitle: flight.aircraftTitle,
    countedHours: counted,
    validity: flight.validity,
  };
}

/**
 * Rank of a pilot from all their closed flights, in any order: totals of the valid ones, and the
 * closing time of the flight that reached the current rank (ranks are never lost, so it is the
 * first time the totals met it).
 */
export function pilotRank(flights: readonly RankedFlight[]): MyRank {
  const ordered = [...flights].sort((a, b) => a.closedAt.localeCompare(b.closedAt));
  let validS = 0;
  let validFlights = 0;
  let totalS = 0;
  let rank: PilotRank = "student";
  let reachedAt: string | null = null;
  for (const flight of ordered) {
    totalS += flight.airborneS ?? 0;
    if (flight.validity !== "valid") continue;
    validS += flight.airborneS ?? 0;
    validFlights += 1;
    const now = rankFor(hoursOf(validS), validFlights);
    if (now !== rank) {
      rank = now;
      reachedAt = flight.closedAt;
    }
  }
  return {
    rank,
    reachedAt,
    validHours: hoursOf(validS),
    validFlights,
    totalHours: hoursOf(totalS),
    next: nextOf(rank),
    recentFlights: ordered.slice(-RANK_RECENT_FLIGHTS).reverse().map(recentLine),
  };
}
