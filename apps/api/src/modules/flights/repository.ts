import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  notInArray,
  or,
  type SQL,
} from "drizzle-orm";
import {
  CloseReason,
  type CloseFlightRequest,
  type FlightEvent,
  FlightEventType,
  type OpenFlightRequest,
  Simulator,
} from "@weems/contrats";
import type { Database } from "../../db/client.ts";
import { flightEvents, flightReviews, flights, flightTracks } from "../../db/schema.ts";
import type { ListPosition } from "./list-cursor.ts";

/** A stored flight, in the shared formats. */
export interface FlightRecord extends OpenFlightRequest {
  pilotId: string;
  closedAt: string | null;
  closeReason: CloseReason | null;
}

type FlightRow = typeof flights.$inferSelect;
type EventRow = typeof flightEvents.$inferSelect;

function toRecord(row: FlightRow): FlightRecord {
  return {
    flightId: row.id,
    pilotId: row.pilotId,
    callsign: row.callsign,
    aircraft: {
      simulator: Simulator.parse(row.simulator),
      title: row.aircraftTitle,
      model: row.aircraftModel,
      registration: row.aircraftRegistration,
      engineCount: row.aircraftEngineCount,
      emptyWeightKg: row.aircraftEmptyWeightKg,
    },
    departureIcao: row.departureIcao,
    plannedArrivalIcao: row.plannedArrivalIcao,
    openedAt: row.openedAt.toISOString(),
    trackerVersion: row.trackerVersion,
    closedAt: row.closedAt?.toISOString() ?? null,
    closeReason: row.closeReason === null ? null : CloseReason.parse(row.closeReason),
  };
}

function toEvent(row: EventRow): FlightEvent {
  return {
    seq: row.seq,
    at: row.at.toISOString(),
    type: FlightEventType.parse(row.type),
    context: row.context,
  };
}

/** Filters of the flight list, already validated. */
export interface ListFilters {
  after?: ListPosition | undefined;
  from?: string | undefined;
  to?: string | undefined;
  aircraft?: string | undefined;
  airport?: string | undefined;
  /** Public profile (spec J4): closed flights only, without the ones the pilot hid. */
  closedOnly?: boolean;
  excluded?: readonly string[];
  /** Profile settings (spec J4): only these flights, the hidden ones. */
  only?: readonly string[];
}

/** Profile filters: closed flights, hidden ones left out, or only some flights. */
function profileConditions(filters: ListFilters): SQL | undefined {
  const { closedOnly = false, excluded = [], only } = filters;
  return and(
    closedOnly ? isNotNull(flights.closedAt) : undefined,
    excluded.length > 0 ? notInArray(flights.id, [...excluded]) : undefined,
    only ? inArray(flights.id, [...only]) : undefined,
  );
}

function listConditions(pilotId: string, filters: ListFilters): SQL | undefined {
  const { after, from, to, aircraft, airport } = filters;
  const like = aircraft && `%${aircraft.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  return and(
    eq(flights.pilotId, pilotId),
    after &&
      or(
        lt(flights.openedAt, new Date(after.openedAt)),
        and(eq(flights.openedAt, new Date(after.openedAt)), lt(flights.id, after.flightId)),
      ),
    from ? gte(flights.openedAt, new Date(from)) : undefined,
    to ? lt(flights.openedAt, new Date(to)) : undefined,
    like ? or(ilike(flights.aircraftTitle, like), ilike(flights.aircraftModel, like)) : undefined,
    airport
      ? or(eq(flights.departureIcao, airport), eq(flights.plannedArrivalIcao, airport))
      : undefined,
    profileConditions(filters),
  );
}

/** The only place that talks to the database about flights. */
export class FlightsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async findFlight(flightId: string): Promise<FlightRecord | null> {
    const rows = await this.db.select().from(flights).where(eq(flights.id, flightId));
    return rows[0] ? toRecord(rows[0]) : null;
  }

  /** Inserts the flight unless the id exists. Returns false when it already existed. */
  async insertFlight(pilotId: string, flight: OpenFlightRequest): Promise<boolean> {
    const inserted = await this.db
      .insert(flights)
      .values({
        id: flight.flightId,
        pilotId,
        callsign: flight.callsign,
        simulator: flight.aircraft.simulator,
        aircraftTitle: flight.aircraft.title,
        aircraftModel: flight.aircraft.model,
        aircraftRegistration: flight.aircraft.registration,
        aircraftEngineCount: flight.aircraft.engineCount,
        aircraftEmptyWeightKg: flight.aircraft.emptyWeightKg,
        departureIcao: flight.departureIcao,
        plannedArrivalIcao: flight.plannedArrivalIcao,
        openedAt: new Date(flight.openedAt),
        trackerVersion: flight.trackerVersion,
      })
      .onConflictDoNothing()
      .returning({ id: flights.id });
    return inserted.length > 0;
  }

  /** Number of flights of each pilot (admin console). */
  async countByPilot(): Promise<Map<string, number>> {
    const rows = await this.db
      .select({ pilotId: flights.pilotId, n: count() })
      .from(flights)
      .groupBy(flights.pilotId);
    return new Map(rows.map((row) => [row.pilotId, row.n]));
  }

  /** Development only: the pilot's flights by simulator. */
  async countBySimulator(pilotId: string): Promise<Map<string, number>> {
    const rows = await this.db
      .select({ simulator: flights.simulator, n: count() })
      .from(flights)
      .where(eq(flights.pilotId, pilotId))
      .groupBy(flights.simulator);
    return new Map(rows.map((row) => [row.simulator, row.n]));
  }

  /**
   * Development only (see dev-routes.ts): deletes the pilot's flights (only those of one
   * simulator when given) with their events, trajectory and review. Returns the deleted ids.
   */
  async deleteAllOf(pilotId: string, simulator?: Simulator): Promise<string[]> {
    const mine = simulator
      ? and(eq(flights.pilotId, pilotId), eq(flights.simulator, simulator))
      : eq(flights.pilotId, pilotId);
    return this.db.transaction(async (tx) => {
      const owned = tx.select({ id: flights.id }).from(flights).where(mine);
      await tx.delete(flightEvents).where(inArray(flightEvents.flightId, owned));
      await tx.delete(flightTracks).where(inArray(flightTracks.flightId, owned));
      await tx.delete(flightReviews).where(inArray(flightReviews.flightId, owned));
      const deleted = await tx.delete(flights).where(mine).returning({ id: flights.id });
      return deleted.map((row) => row.id);
    });
  }

  /** Closes the flight if still open. Returns false when it was already closed. */
  async closeFlight(flightId: string, close: CloseFlightRequest): Promise<boolean> {
    const updated = await this.db
      .update(flights)
      .set({ closedAt: new Date(close.closedAt), closeReason: close.reason })
      .where(and(eq(flights.id, flightId), isNull(flights.closedAt)))
      .returning({ id: flights.id });
    return updated.length > 0;
  }

  /** A pilot's flights, newest first; all of them when no limit is given. */
  async listFlights(
    pilotId: string,
    filters: ListFilters,
    limit?: number,
  ): Promise<FlightRecord[]> {
    const query = this.db
      .select()
      .from(flights)
      .where(listConditions(pilotId, filters))
      .orderBy(desc(flights.openedAt), desc(flights.id))
      .$dynamic();
    const rows = await (limit === undefined ? query : query.limit(limit));
    return rows.map(toRecord);
  }

  /** Events of several flights at once, by flight, in sequence order. */
  async eventsOf(flightIds: string[]): Promise<Map<string, FlightEvent[]>> {
    const byFlight = new Map<string, FlightEvent[]>(flightIds.map((id) => [id, []]));
    if (flightIds.length === 0) return byFlight;
    const rows = await this.db
      .select()
      .from(flightEvents)
      .where(inArray(flightEvents.flightId, flightIds))
      .orderBy(asc(flightEvents.flightId), asc(flightEvents.seq));
    for (const row of rows) byFlight.get(row.flightId)?.push(toEvent(row));
    return byFlight;
  }

  async listEvents(flightId: string, seqs?: number[]): Promise<FlightEvent[]> {
    const bySeq = seqs ? inArray(flightEvents.seq, seqs) : undefined;
    const rows = await this.db
      .select()
      .from(flightEvents)
      .where(and(eq(flightEvents.flightId, flightId), bySeq))
      .orderBy(asc(flightEvents.seq));
    return rows.map(toEvent);
  }

  /** Inserts the events whose (flight, seq) is new. Returns how many were new. */
  async insertEvents(flightId: string, events: FlightEvent[]): Promise<number> {
    const inserted = await this.db
      .insert(flightEvents)
      .values(events.map((e) => ({ flightId, ...e, at: new Date(e.at) })))
      .onConflictDoNothing()
      .returning({ seq: flightEvents.seq });
    return inserted.length;
  }
}
