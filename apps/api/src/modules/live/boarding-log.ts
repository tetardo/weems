import { BOARDING_LANDED_KEEP_MS } from "@weems/contrats";

/** What the Boarding page needs beyond the last position: when each step happened. */
export interface BoardingTimes {
  startedAt: string;
  takeoffAt: string | null;
  landedAt: string | null;
  touchdownVs: number | null;
}

/** A flight closed after landing, kept on the Arrivals board for an hour (T: the live entry). */
interface Landed<T> {
  entry: T;
  times: BoardingTimes;
}

/**
 * Times of the flights live now, and the flights landed within the last hour once closed
 * (spec web Boarding). In memory, like the trails: lost when the API restarts.
 */
export class BoardingLog<T> {
  private readonly times = new Map<string, BoardingTimes>();
  private landed = new Map<string, Landed<T>>();

  /** A position arrived: the first one dates the start of the flight. */
  seen(flightId: string, at: string): void {
    if (!this.times.has(flightId)) {
      this.times.set(flightId, {
        startedAt: at,
        takeoffAt: null,
        landedAt: null,
        touchdownVs: null,
      });
    }
  }

  takeoff(flightId: string, at: string): void {
    const times = this.times.get(flightId);
    if (times) times.takeoffAt = at;
  }

  /** The last touchdown counts: a touch-and-go is followed by another one. */
  touchdown(flightId: string, at: string, touchdownVs: number | null): void {
    const times = this.times.get(flightId);
    if (times) Object.assign(times, { landedAt: at, touchdownVs });
  }

  of(flightId: string): BoardingTimes | undefined {
    return this.times.get(flightId);
  }

  /** The flight left the map: kept on the Arrivals board if it landed, forgotten otherwise. */
  closed(flightId: string, entry: T): void {
    const times = this.times.get(flightId);
    this.times.delete(flightId);
    if (times?.landedAt) this.landed.set(flightId, { entry, times });
  }

  /** Flights closed after a touchdown less than an hour ago, by flight id. */
  recentLandings(nowMs: number): ReadonlyMap<string, Landed<T>> {
    for (const [id, { times }] of this.landed) {
      if (nowMs - Date.parse(times.landedAt ?? "") > BOARDING_LANDED_KEEP_MS)
        this.landed.delete(id);
    }
    return this.landed;
  }
}
