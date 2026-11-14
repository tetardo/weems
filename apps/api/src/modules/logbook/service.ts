import type {
  FlightBands,
  LogbookEntries,
  LogbookList,
  LogbookListQuery,
  LogbookStats,
  LogbookStatsPeriod,
  LogbookSummary,
} from "@weems/contrats";
import type { AirportsService } from "../airports/service.ts";
import type { Caller } from "../../plugins/auth.ts";
import type { FlightsService } from "../flights/service.ts";
import type { PlansService } from "../plans/service.ts";
import { lengthNm } from "../profiles/stats.ts";
import type { TracksService } from "../tracks/service.ts";
import { flightBands, fuelUsedKg } from "./bands.ts";
import { logbookEntry } from "./entries.ts";
import { logbookList } from "./list.ts";
import { inPeriod, logbookStats } from "./stats.ts";
import { logbookSummary } from "./summary.ts";

/**
 * Private logbook of the pilot (spec carnet privé): every closed flight counts, hidden ones
 * included. Reads the flights, the trajectories and the plan through their services only.
 */
export class PrivateLogbookService {
  private readonly flights: FlightsService;
  private readonly tracks: TracksService;
  private readonly plans: PlansService;
  private readonly airports: AirportsService;

  constructor(
    flights: FlightsService,
    tracks: TracksService,
    plans: PlansService,
    airports: AirportsService,
  ) {
    this.flights = flights;
    this.tracks = tracks;
    this.plans = plans;
    this.airports = airports;
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

  /** Page Vols: the list searched, filtered, sorted, and the asked slice, with airport names. */
  async list(caller: Caller, query: LogbookListQuery): Promise<LogbookList> {
    const closed = await this.flights.allClosed(caller.pilotId);
    const airportName = (icao: string | null) => this.airports.find(icao)?.name ?? null;
    return logbookList(closed.map(logbookEntry), query, airportName);
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

  /** Page Statistiques: « all » needs an unlimited period (Pilot Pro), else 12 months. */
  async stats(caller: Caller, asked: LogbookStatsPeriod, now = new Date()): Promise<LogbookStats> {
    const id = caller.pilotId;
    const [closed, limit, categoryTrends, phaseTime, goodPractices] = await Promise.all([
      this.flights.allClosed(id),
      this.plans.valueOf(id, "statsPeriod"),
      this.plans.includes(id, "categoryTrends"),
      this.plans.includes(id, "phaseTime"),
      this.plans.includes(id, "goodPractices"),
    ]);
    const allowedPeriods: LogbookStatsPeriod[] =
      limit === "unlimited" ? ["30d", "12m", "all"] : ["30d", "12m"];
    const period = allowedPeriods.includes(asked) ? asked : "12m";
    const ids = inPeriod(closed, period, now).map(({ summary }) => summary.flightId);
    const tracks = await this.tracks.simplifiedOf(ids);
    const airportName = (icao: string) => this.airports.find(icao)?.name ?? null;
    const pro = { categoryTrends, phaseTime, goodPractices };
    return logbookStats(closed, tracks, { period, allowedPeriods, pro, airportName }, now);
  }
}
