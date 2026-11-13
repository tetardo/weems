import type { MyRank, PublicRank } from "@weems/contrats";
import type { FlightsService, SummaryWithEvents } from "../flights/service.ts";
import { flightValidity } from "../flights/validity.ts";
import { lengthNm } from "../profiles/stats.ts";
import type { TracksService } from "../tracks/service.ts";
import { type RankedFlight, pilotRank } from "./rank.ts";

/**
 * Public ranks are read for every pilot of the live map and Boarding every 30 s: each is kept this
 * long, and forgotten as soon as one of their flights is complete.
 */
const RANK_CACHE_MS = 10 * 60_000;

function ranked(flight: SummaryWithEvents, distanceNm: number | null): RankedFlight {
  const { summary } = flight;
  return {
    flightId: summary.flightId,
    openedAt: summary.openedAt,
    closedAt: summary.closedAt ?? summary.openedAt,
    departureIcao: summary.departureIcao,
    arrivalIcao: summary.plannedArrivalIcao,
    aircraftTitle: summary.aircraftTitle,
    airborneS: summary.times.airborneS,
    validity: flightValidity(flight, distanceNm),
  };
}

/**
 * Pilot ranks (spec grades des pilotes): computed from every closed flight of the pilot, hidden
 * ones included, with the valid flight rules of the founders offer. Nothing is stored.
 */
export class RanksService {
  private readonly flights: FlightsService;
  private readonly tracks: TracksService;
  private readonly now: () => number;
  private readonly cache = new Map<string, { at: number; rank: PublicRank }>();

  constructor(flights: FlightsService, tracks: TracksService, now: () => number = Date.now) {
    this.flights = flights;
    this.tracks = tracks;
    this.now = now;
  }

  /** GET /v1/me/rank: always computed afresh. */
  async mine(pilotId: string): Promise<MyRank> {
    const rank = await this.compute(pilotId);
    this.cache.set(pilotId, {
      at: this.now(),
      rank: { rank: rank.rank, reachedAt: rank.reachedAt },
    });
    return rank;
  }

  /** Ranks shown on public pages and the live map, by pilot id. */
  async publicOf(pilotIds: readonly string[]): Promise<Map<string, PublicRank>> {
    const result = new Map<string, PublicRank>();
    for (const pilotId of new Set(pilotIds)) {
      const cached = this.cache.get(pilotId);
      if (cached && this.now() - cached.at < RANK_CACHE_MS) {
        result.set(pilotId, cached.rank);
        continue;
      }
      const { rank, reachedAt } = await this.mine(pilotId);
      result.set(pilotId, { rank, reachedAt });
    }
    return result;
  }

  /** A flight of the pilot is complete (trajectory stored): their rank may have changed. */
  flightCompleted(pilotId: string): void {
    this.cache.delete(pilotId);
  }

  private async compute(pilotId: string): Promise<MyRank> {
    const closed = await this.flights.allClosed(pilotId);
    const tracks = await this.tracks.simplifiedOf(closed.map((f) => f.summary.flightId));
    return pilotRank(
      closed.map((flight) => {
        const points = tracks.get(flight.summary.flightId);
        return ranked(flight, points && points.length > 1 ? lengthNm(points) : null);
      }),
    );
  }
}
