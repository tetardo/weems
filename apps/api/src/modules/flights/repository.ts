import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import {
  CloseReason,
  type CloseFlightRequest,
  type FlightEvent,
  FlightEventType,
  type OpenFlightRequest,
  Simulator,
} from "@weems/contrats";
import type { Database } from "../../db/client.ts";
import { flightEvents, flights } from "../../db/schema.ts";

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

  /** Closes the flight if still open. Returns false when it was already closed. */
  async closeFlight(flightId: string, close: CloseFlightRequest): Promise<boolean> {
    const updated = await this.db
      .update(flights)
      .set({ closedAt: new Date(close.closedAt), closeReason: close.reason })
      .where(and(eq(flights.id, flightId), isNull(flights.closedAt)))
      .returning({ id: flights.id });
    return updated.length > 0;
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
