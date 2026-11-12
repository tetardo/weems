import type { FlightBands, LogbookEntries, LogbookSummary } from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import type { FlightsService } from "../flights/service.ts";
import type { PlansService } from "../plans/service.ts";
import { lengthNm } from "../profiles/stats.ts";
import type { TracksService } from "../tracks/service.ts";
import { flightBands, fuelUsedKg } from "./bands.ts";
import { logbookEntry } from "./entries.ts";
import { logbookSummary } from "./summary.ts";

/**
 * Private logbook of the pilot (spec carnet privé): every closed flight counts, hidden ones
 * included. Reads the flights, the trajectories and the plan through their services only.
 */
export class PrivateLogbookService {
  private readonly flights: FlightsService;
  private readonly tracks: TracksService;
  private readonly plans: PlansService;

  constructor(flights: FlightsService, tracks: TracksService, plans: PlansService) {
    this.flights = flights;
    this.tracks = tracks;
    this.plans = plans;
  }

  async summary(caller: Caller, now = new Date()): Promise<LogbookSummary> {
    const closed = await this.flights.allClosed(caller.pilotId);
    const lastId = closed[0]?.summary.flightId;
    const track = lastId ? (await this.tracks.simplifiedOf([lastId])).get(lastId) : undefined;
    const lastTrack = track && { distanceNm: lengthNm(track), fuelUsedKg: fuelUsedKg(track) };
    return logbookSummary(closed, lastTrack ?? null, now);
  }

  async entries(caller: Caller): Promise<LogbookEntries> {
    const closed = await this.flights.allClosed(caller.pilotId);
    return { entries: closed.map(logbookEntry) };
  }

  /** Flight bands; the stretches to review only when the plan includes them (Pilot Pro). */
  async bands(caller: Caller, flightId: string): Promise<FlightBands> {
    const [points, withMarks, simplified] = await Promise.all([
      this.tracks.recorded(caller, flightId), // 404 unless the caller's, with a trajectory
      this.plans.includes(caller.pilotId, "flightBandsMarks"),
      this.tracks.simplifiedOf([flightId]),
    ]);
    return {
      ...flightBands(points, withMarks),
      distanceNm: lengthNm(simplified.get(flightId) ?? []),
    };
  }
}
