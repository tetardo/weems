import type { LogbookSummary } from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import type { FlightsService } from "../flights/service.ts";
import { lengthNm } from "../profiles/stats.ts";
import type { TracksService } from "../tracks/service.ts";
import { logbookSummary } from "./summary.ts";

/**
 * Private logbook of the pilot (spec carnet privé): every closed flight counts, hidden ones
 * included. Reads the flights and the trajectories through their services only.
 */
export class PrivateLogbookService {
  private readonly flights: FlightsService;
  private readonly tracks: TracksService;

  constructor(flights: FlightsService, tracks: TracksService) {
    this.flights = flights;
    this.tracks = tracks;
  }

  async summary(caller: Caller, now = new Date()): Promise<LogbookSummary> {
    const closed = await this.flights.allClosed(caller.pilotId);
    const lastId = closed[0]?.summary.flightId;
    const track = lastId ? (await this.tracks.simplifiedOf([lastId])).get(lastId) : undefined;
    return logbookSummary(closed, track ? lengthNm(track) : null, now);
  }
}
