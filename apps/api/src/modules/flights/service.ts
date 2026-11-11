import { isDeepStrictEqual } from "node:util";
import {
  type CloseFlightRequest,
  type FlightEvent,
  type FlightList,
  type FlightListQuery,
  type FlightPhase,
  type FlightView,
  type OpenFlightRequest,
  phaseChangeOf,
  type PositionReport,
  type Receipt,
} from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import { ApiProblem, conflict, notFound } from "../../plugins/problem.ts";
import { flightTimes } from "./flight-times.ts";
import { summarize } from "./flight-summary.ts";
import { decodeCursor, encodeCursor } from "./list-cursor.ts";
import type { LiveFeed, LiveFlightInfo } from "./live-feed.ts";
import type { FlightRecord, FlightsRepository } from "./repository.ts";

const CREATED: Receipt = { result: "created" };
const ALREADY_RECEIVED: Receipt = { result: "alreadyReceived" };

function openedPart(flight: FlightRecord): OpenFlightRequest {
  const { pilotId: _pilot, closedAt: _closedAt, closeReason: _reason, ...opened } = flight;
  return opened;
}

/** Last phase reached, from the most recent "phaseChanged" event. */
export function lastPhaseOf(events: FlightEvent[]): FlightPhase | null {
  return events.map(phaseChangeOf).findLast((change) => change !== null)?.to ?? null;
}

function liveInfo(flight: FlightRecord): LiveFlightInfo {
  return {
    flightId: flight.flightId,
    callsign: flight.callsign,
    aircraftTitle: flight.aircraft.title,
    aircraftModel: flight.aircraft.model,
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
    if (await this.repository.insertFlight(caller.pilotId, request)) return CREATED;
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
    this.live.position(liveInfo(flight), position);
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
    const after = cursor === undefined ? undefined : decodeCursor(cursor);
    // One more than asked: tells whether a next page exists.
    const found = await this.repository.listFlights(
      caller.pilotId,
      { ...filters, after },
      limit + 1,
    );
    const page = found.slice(0, limit);
    const events = await this.repository.eventsOf(page.map((f) => f.flightId));
    const last = page[page.length - 1];
    return {
      flights: page.map((f) => summarize(f, events.get(f.flightId) ?? [])),
      nextCursor: found.length > limit && last ? encodeCursor(last) : null,
    };
  }

  /** Development only: empties the caller's flight list (and takes them off the live map). */
  async deleteAll(caller: Caller): Promise<void> {
    const deleted = await this.repository.deleteAllOf(caller.pilotId);
    for (const flightId of deleted) this.live.closed(flightId);
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
