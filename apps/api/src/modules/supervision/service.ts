import type {
  AdminSupervision,
  SupervisionActivity,
  SupervisionCommunity,
  SupervisionHealth,
  SupervisionTiles,
} from "@weems/contrats";
import { ALPHA_TARGETS, alphaReport } from "../alpha/alpha-report.ts";
import { fillDays, lastParisDays } from "./days.ts";
import type { SupervisionRepository } from "./repository.ts";
import type { EventRecord, SupervisionListsRepository } from "./repository-lists.ts";
import type { SupervisionSystemRepository } from "./repository-system.ts";
import type { TrafficMetrics } from "./traffic-metrics.ts";

/** Flights on the live map: implemented by the live module's board. */
interface LiveFlightIds {
  flightIds(): string[];
}

export interface SupervisionSources {
  counts: SupervisionRepository;
  lists: SupervisionListsRepository;
  system: SupervisionSystemRepository;
  live: LiveFlightIds;
  metrics: TrafficMetrics;
  /** Migrations brought by the code (journal of migrations/). */
  expectedMigrations: number;
  now?: () => Date;
}

const LIST_LENGTH = 8;
const EVENT_COUNT = 10;

const toEvent = ({ at, kind, pilot, callsign, from, to }: EventRecord) => ({
  at: at.toISOString(),
  kind,
  pilot,
  flight: callsign === null ? null : { callsign, from, to },
});

const round1 = (hours: number) => Math.round(hours * 10) / 10;

/** The page Supervision of the console (console spec): one read, every section. */
export class SupervisionService {
  private readonly sources: SupervisionSources;
  private readonly now: () => Date;

  constructor(sources: SupervisionSources) {
    this.sources = sources;
    this.now = sources.now ?? (() => new Date());
  }

  async supervision(): Promise<AdminSupervision> {
    const now = this.now();
    const days = lastParisDays(now, 14);
    const { counts } = this.sources;
    const [perDay, facts] = await Promise.all([counts.flightsPerDay(14), counts.realFlightFacts()]);
    const flightDays = fillDays(days, perDay, (date) => ({ date, real: 0, simulated: 0 }));
    const alpha = alphaReport(facts, now);
    const [tiles, health, activity, community] = await Promise.all([
      this.tiles(
        flightDays.slice(-7).map((day) => day.real),
        alpha,
      ),
      this.health(now),
      this.activity(flightDays, alpha),
      this.community(),
    ]);
    return { generatedAt: now.toISOString(), tiles, health, activity, community };
  }

  private async tiles(
    flightsDaily: number[],
    alpha: ReturnType<typeof alphaReport>,
  ): Promise<SupervisionTiles> {
    const { counts, live } = this.sources;
    const liveIds = live.flightIds();
    const [accounts, accountsDaily, flights, profiles, profilesDaily, liveSimulated] =
      await Promise.all([
        counts.accountCounts(),
        counts.accountsDaily(7),
        counts.flightCounts(),
        counts.profileCounts(),
        counts.profilesDaily(7),
        counts.countSimulated(liveIds),
      ]);
    return {
      accounts: { ...accounts, daily: accountsDaily },
      flights: { ...flights, daily: flightsDaily },
      live: { flights: liveIds.length, simulated: liveSimulated },
      profiles: { ...profiles, realAccounts: accounts.real, daily: profilesDaily },
      suspicious: { stale: alpha.staleFlights, withoutTrack: alpha.closedWithoutTrack },
    };
  }

  private async health(now: Date): Promise<SupervisionHealth> {
    const { counts, system, metrics, expectedMigrations } = this.sources;
    const [trackerVersions, bytes, largestTables, applied] = await Promise.all([
      counts.trackerVersions(),
      system.databaseBytes(),
      system.largestTables(3),
      system.appliedMigrations(),
    ]);
    return {
      apiHours: metrics.apiHours(now.getTime()),
      positionsPerMinute: metrics.positionsPerMinute(now.getTime()),
      lastPositionAt: metrics.lastPositionAt?.toISOString() ?? null,
      measuredSince: metrics.measuredSince.toISOString(),
      trackerVersions,
      database: { bytes, largestTables },
      migrations: { applied, expected: expectedMigrations },
    };
  }

  private async activity(
    days: SupervisionActivity["days"],
    alpha: ReturnType<typeof alphaReport>,
  ): Promise<SupervisionActivity> {
    const events = await this.sources.lists.latestEvents(EVENT_COUNT);
    return {
      days,
      alpha: {
        pilots: alpha.pilots,
        closedFlights: alpha.closedFlights,
        correctShare: alpha.correctShare,
        targets: { ...ALPHA_TARGETS },
      },
      events: events.map(toEvent),
    };
  }

  private async community(): Promise<SupervisionCommunity> {
    const { lists } = this.sources;
    const [newest, mostActive, mostHours] = await Promise.all([
      lists.newestPilots(LIST_LENGTH),
      lists.mostActive(LIST_LENGTH),
      lists.mostHours(LIST_LENGTH),
    ]);
    const rounded = <T extends { hours: number }>(pilot: T) => ({
      ...pilot,
      hours: round1(pilot.hours),
    });
    return {
      newest: newest.map((pilot) => ({ ...pilot, createdAt: pilot.createdAt.toISOString() })),
      mostActive: mostActive.map(rounded),
      mostHours: mostHours.map(rounded),
    };
  }
}
