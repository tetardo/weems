import { isDeepStrictEqual } from "node:util";
import {
  type CloseFlightRequest,
  type DevFlightCounts,
  type FlightEvent,
  type FlightList,
  type FlightListQuery,
  type FlightPhase,
  type FlightSummary,
  type FlightView,
  type OpenFlightRequest,
  phaseChangeOf,
  type PositionReport,
  type Receipt,
  type Simulator,
} from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import { classifyAircraft } from "../aircraft/classify.ts";
import { ApiProblem, conflict, notFound } from "../../plugins/problem.ts";
import { flightTimes } from "./flight-times.ts";
import { summarize } from "./flight-summary.ts";
import { decodeCursor, encodeCursor } from "./list-cursor.ts";
import type { LiveFeed, LiveFlightInfo } from "./live-feed.ts";
import type { FlightRecord, FlightsRepository, ListFilters } from "./repository.ts";

/** A line of a flight list with the events it was computed from (statistics need them). */
export interface SummaryWithEvents {
  summary: FlightSummary;
  events: FlightEvent[];
  /** Engines of the aircraft: single- or multi-engine time of the profile. */
  engineCount: number;
}

/** One page of flights, and the cursor of the next one (null on the last page). */
interface Page {
  flights: SummaryWithEvents[];
  nextCursor: string | null;
}

const CREATED: Receipt = { result: "created" };
const ALREADY_RECEIVED: Receipt = { result: "alreadyReceived" };

function openedPart(flight: FlightRecord): OpenFlightRequest {
  const {
    pilotId: _pilot,
    closedAt: _closedAt,
    closeReason: _reason,
    aircraftClass: _class,
    ...opened
  } = flight;
  return opened;
}

/** Last phase reached, from the most recent "phaseChanged" event. */
export function lastPhaseOf(events: FlightEvent[]): FlightPhase | null {
  return events.map(phaseChangeOf).findLast((change) => change !== null)?.to ?? null;
}

function liveInfo(flight: FlightRecord, caller: Caller): LiveFlightInfo {
  return {
    fictitious: caller.fictitious === true,
    pilotId: flight.pilotId,
    flightId: flight.flightId,
    callsign: flight.callsign,
    aircraftTitle: flight.aircraft.title,
    aircraftModel: flight.aircraft.model,
    aircraftClass: flight.aircraftClass,
    departureIcao: flight.departureIcao,
    plannedArrivalIcao: flight.plannedArrivalIcao,
  };
}

function assertDistinctSeqs(events: FlightEvent[]): void {
  if (new Set(events.map((e) => e.seq)).size !== events.length) {
    throw new ApiProblem(400, "Bad Request", "Two events of the request share the same seq.");
  }
}

/**
 * Flight business rules. Every tracker message is idempotent:
 * an identical re-send changes nothing, a different one with the same id is a conflict.
 */
export class FlightsService {
  private readonly repository: FlightsRepository;
  private readonly live: LiveFeed;

  constructor(repository: FlightsRepository, live: LiveFeed) {
    this.repository = repository;
    this.live = live;
  }

  async open(caller: Caller, request: OpenFlightRequest): Promise<Receipt> {
    const aircraftClass = classifyAircraft(request.aircraft);
    if (await this.repository.insertFlight(caller.pilotId, request, aircraftClass)) return CREATED;
    const existing = await this.repository.findFlight(request.flightId);
    if (existing?.pilotId === caller.pilotId && isDeepStrictEqual(openedPart(existing), request)) {
      return ALREADY_RECEIVED;
    }
    throw conflict(`Flight ${request.flightId} already exists with different content.`);
  }

  async addEvents(caller: Caller, flightId: string, events: FlightEvent[]): Promise<Receipt> {
    await this.ownFlight(caller, flightId);
    assertDistinctSeqs(events);
    const known = await this.repository.listEvents(
      flightId,
      events.map((e) => e.seq),
    );
    for (const stored of known) {
      const sent = events.find((e) => e.seq === stored.seq);
      if (!isDeepStrictEqual(stored, sent)) {
        throw conflict(`Event ${stored.seq} of flight ${flightId} differs from the stored one.`);
      }
    }
    if (known.length === events.length) return ALREADY_RECEIVED;
    await this.repository.insertEvents(flightId, events);
    const knownSeqs = new Set(known.map((e) => e.seq));
    this.live.events(
      flightId,
      events.filter((e) => !knownSeqs.has(e.seq)),
    );
    return CREATED;
  }

  async reportPosition(
    caller: Caller,
    flightId: string,
    position: PositionReport,
  ): Promise<Receipt> {
    const flight = await this.ownFlight(caller, flightId);
    const last = this.live.lastPosition(flightId);
    if (last && position.seq === last.seq) {
      if (isDeepStrictEqual(last, position)) return ALREADY_RECEIVED;
      throw conflict(`Position ${position.seq} of flight ${flightId} differs from the stored one.`);
    }
    // Late (older) positions and positions after closing are ignored: only the newest counts.
    if ((last && position.seq < last.seq) || flight.closedAt !== null) return ALREADY_RECEIVED;
    this.live.position(liveInfo(flight, caller), position);
    return CREATED;
  }

  async close(caller: Caller, flightId: string, request: CloseFlightRequest): Promise<Receipt> {
    await this.ownFlight(caller, flightId);
    if (await this.repository.closeFlight(flightId, request)) {
      this.live.closed(flightId);
      return CREATED;
    }
    const flight = await this.ownFlight(caller, flightId);
    if (flight.closedAt === request.closedAt && flight.closeReason === request.reason) {
      return ALREADY_RECEIVED;
    }
    throw conflict(`Flight ${flightId} is already closed differently.`);
  }

  async read(caller: Caller, flightId: string): Promise<FlightView> {
    const flight = await this.ownFlight(caller, flightId);
    const events = await this.repository.listEvents(flightId);
    const { trackerVersion: _version, pilotId: _pilot, ...view } = flight;
    return { ...view, lastPhase: lastPhaseOf(events), times: flightTimes(flight, events), events };
  }

  /** The caller's flights, newest first, one page at a time. */
  async list(caller: Caller, query: FlightListQuery): Promise<FlightList> {
    const { cursor, limit, ...filters } = query;
    const page = await this.page(caller.pilotId, filters, cursor, limit);
    return { flights: page.flights.map((f) => f.summary), nextCursor: page.nextCursor };
  }

  /** Flights of a public profile (spec J4): closed, not hidden, newest first, one page at a time. */
  async listPublic(
    pilotId: string,
    hidden: readonly string[],
    query: { cursor?: string | undefined; limit: number },
  ): Promise<Page> {
    return this.page(pilotId, { closedOnly: true, excluded: hidden }, query.cursor, query.limit);
  }

  /** Every flight a public profile shows, for its statistics. */
  async allPublic(pilotId: string, hidden: readonly string[]): Promise<SummaryWithEvents[]> {
    const found = await this.repository.listFlights(pilotId, {
      closedOnly: true,
      excluded: hidden,
    });
    return this.withEvents(found);
  }

  /** Every closed flight of the pilot, hidden ones included, newest first: private logbook. */
  async allClosed(pilotId: string): Promise<SummaryWithEvents[]> {
    return this.allPublic(pilotId, []);
  }

  /** Some of the caller's flights, newest first: the ones hidden from their profile (spec J4). */
  async summariesOf(caller: Caller, flightIds: readonly string[]): Promise<FlightSummary[]> {
    if (flightIds.length === 0) return [];
    const found = await this.repository.listFlights(caller.pilotId, { only: flightIds });
    return (await this.withEvents(found)).map((f) => f.summary);
  }

  private async page(
    pilotId: string,
    filters: ListFilters,
    cursor: string | undefined,
    limit: number,
  ): Promise<Page> {
    const after = cursor === undefined ? undefined : decodeCursor(cursor);
    // One more than asked: tells whether a next page exists.
    const found = await this.repository.listFlights(pilotId, { ...filters, after }, limit + 1);
    const page = found.slice(0, limit);
    const last = page[page.length - 1];
    return {
      flights: await this.withEvents(page),
      nextCursor: found.length > limit && last ? encodeCursor(last) : null,
    };
  }

  private async withEvents(found: FlightRecord[]): Promise<SummaryWithEvents[]> {
    const events = await this.repository.eventsOf(found.map((f) => f.flightId));
    return found.map((f) => {
      const own = events.get(f.flightId) ?? [];
      return { summary: summarize(f, own), events: own, engineCount: f.aircraft.engineCount };
    });
  }

  /**
   * Development only: empties the caller's flight list, or only the flights of one simulator
   * ("replay": simulated flights, never the real ones of pnpm fly), and takes them off the live map.
   */
  async deleteAll(caller: Caller, simulator?: Simulator): Promise<void> {
    const deleted = await this.repository.deleteAllOf(caller.pilotId, simulator);
    for (const flightId of deleted) this.live.closed(flightId);
  }

  /** Development only: the caller's simulated and real flights (admin console). */
  async devCounts(caller: Caller): Promise<DevFlightCounts> {
    const bySimulator = await this.repository.countBySimulator(caller.pilotId);
    let simulated = 0;
    let real = 0;
    for (const [simulator, n] of bySimulator) {
      if (simulator === "replay") simulated += n;
      else real += n;
    }
    return { simulated, real };
  }

  /** Every recorded flight (home page counter). */
  countAll(): Promise<number> {
    return this.repository.countAll();
  }

  /** Number of flights of each pilot (admin console, FlightCounter of the accounts module). */
  countByPilot(): Promise<Map<string, number>> {
    return this.repository.countByPilot();
  }

  /** A pilot only sees their own flights: someone else's flight is "not found". */
  private async ownFlight(caller: Caller, flightId: string): Promise<FlightRecord> {
    const flight = await this.repository.findFlight(flightId);
    if (!flight || flight.pilotId !== caller.pilotId) {
      throw notFound(`Flight ${flightId} not found.`);
    }
    return flight;
  }
}
