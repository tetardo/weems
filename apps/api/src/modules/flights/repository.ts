import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, or, type SQL } from "drizzle-orm";
import {
  AircraftCategory,
  type AircraftClass,
  Airframe,
  CloseReason,
  EngineType,
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
  aircraftClass: AircraftClass | null;
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
      engineType: EngineType.nullable().parse(row.aircraftEngineType),
      airframe: Airframe.nullable().parse(row.aircraftAirframe),
      maxGrossWeightKg: row.aircraftMaxGrossWeightKg,
    },
    aircraftClass: classOf(row),
    departureIcao: row.departureIcao,
    plannedArrivalIcao: row.plannedArrivalIcao,
    openedAt: row.openedAt.toISOString(),
    trackerVersion: row.trackerVersion,
    closedAt: row.closedAt?.toISOString() ?? null,
    closeReason: row.closeReason === null ? null : CloseReason.parse(row.closeReason),
  };
}

function classOf(row: FlightRow): AircraftClass | null {
  if (row.aircraftCategory === null) return null;
  return {
    category: AircraftCategory.parse(row.aircraftCategory),
    estimated: row.aircraftCategoryEstimated,
  };
}

/** Columns of the aircraft category; no category is stored as null. */
function classColumns(aircraftClass: AircraftClass | null) {
  return {
    aircraftCategory: aircraftClass?.category ?? null,
    aircraftCategoryEstimated: aircraftClass?.estimated ?? false,
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
  category?: AircraftCategory | undefined;
  airport?: string | undefined;
}

function listConditions(pilotId: string, filters: ListFilters): SQL | undefined {
  const { after, from, to, aircraft, category, airport } = filters;
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
    category ? eq(flights.aircraftCategory, category) : undefined,
    airport
      ? or(eq(flights.departureIcao, airport), eq(flights.plannedArrivalIcao, airport))
      : undefined,
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
  async insertFlight(
    pilotId: string,
    flight: OpenFlightRequest,
    aircraftClass: AircraftClass | null,
  ): Promise<boolean> {
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
        aircraftEngineType: flight.aircraft.engineType,
        aircraftAirframe: flight.aircraft.airframe,
        aircraftMaxGrossWeightKg: flight.aircraft.maxGrossWeightKg,
        ...classColumns(aircraftClass),
        departureIcao: flight.departureIcao,
        plannedArrivalIcao: flight.plannedArrivalIcao,
        openedAt: new Date(flight.openedAt),
        trackerVersion: flight.trackerVersion,
      })
      .onConflictDoNothing()
      .returning({ id: flights.id });
    return inserted.length > 0;
  }

  /**
   * Development only (see dev-routes.ts): deletes every flight of the pilot with its events,
   * trajectory and review. Returns the deleted ids.
   */
  async deleteAllOf(pilotId: string): Promise<string[]> {
    return this.db.transaction(async (tx) => {
      const owned = tx.select({ id: flights.id }).from(flights).where(eq(flights.pilotId, pilotId));
      await tx.delete(flightEvents).where(inArray(flightEvents.flightId, owned));
      await tx.delete(flightTracks).where(inArray(flightTracks.flightId, owned));
      await tx.delete(flightReviews).where(inArray(flightReviews.flightId, owned));
      const deleted = await tx
        .delete(flights)
        .where(eq(flights.pilotId, pilotId))
        .returning({ id: flights.id });
      return deleted.map((row) => row.id);
    });
  }

  /** Every flight, for re-classifying them after a catalogue change. */
  async allFlights(): Promise<FlightRecord[]> {
    const rows = await this.db.select().from(flights);
    return rows.map(toRecord);
  }

  async setAircraftClass(flightId: string, aircraftClass: AircraftClass | null): Promise<void> {
    await this.db.update(flights).set(classColumns(aircraftClass)).where(eq(flights.id, flightId));
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

  /** A pilot's flights, newest first. */
  async listFlights(pilotId: string, filters: ListFilters, limit: number): Promise<FlightRecord[]> {
    const rows = await this.db
      .select()
      .from(flights)
      .where(listConditions(pilotId, filters))
      .orderBy(desc(flights.openedAt), desc(flights.id))
      .limit(limit);
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
