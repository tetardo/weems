import {
  type AdminDatabase,
  CLEANUP_SIMULATED_AFTER_DAYS,
  type DatabaseCleanupPreview,
  type DatabaseCleanupRequest,
  type DatabaseCleanupResult,
  type DatabaseTable,
} from "@weems/contrats";
import type { MigrationFile } from "../../db/migration-journal.ts";
import type { AccountsCleanupService } from "../accounts/cleanup-service.ts";
import type { FlightsCleanupService } from "../flights/cleanup-service.ts";
import { historyDays, historyStart, KEEP_READINGS_DAYS, utcDay } from "./history.ts";
import type { HistoryRepository } from "./history-repository.ts";
import { migrationStates } from "./migration-states.ts";
import type { DatabaseRepository, SimulatedShares, TableSize } from "./repository.ts";

export interface DatabaseSources {
  repository: DatabaseRepository;
  history: HistoryRepository;
  flights: FlightsCleanupService;
  accounts: AccountsCleanupService;
  /** Migrations brought by the code (migrations/). */
  migrationFiles: MigrationFile[];
  now?: () => Date;
}

const DAY_MS = 86_400_000;

const isFlightTable = (name: string): name is keyof SimulatedShares =>
  name === "flights" || name === "flight_events" || name === "flight_tracks";

function toTable(table: TableSize, shares: SimulatedShares): DatabaseTable {
  const { name, rowsEstimate, totalBytes, indexBytes } = table;
  return {
    name,
    rowsEstimate,
    dataBytes: Math.max(0, totalBytes - indexBytes),
    indexBytes,
    totalBytes,
    simulatedShare: isFlightTable(name) ? Math.min(1, shares[name]) : null,
  };
}

/** The page Base de données of the admin console (spec admin): sizes, migrations, cleanup. */
export class DatabaseService {
  private readonly sources: DatabaseSources;
  private readonly now: () => Date;

  constructor(sources: DatabaseSources) {
    this.sources = sources;
    this.now = sources.now ?? (() => new Date());
  }

  async database(): Promise<AdminDatabase> {
    const now = this.now();
    const { repository, migrationFiles } = this.sources;
    const [server, tables, shares, recorded, cleanup] = await Promise.all([
      repository.server(),
      repository.tables(),
      repository.simulatedShares(),
      repository.recordedMigrations(),
      this.preview(now),
    ]);
    await this.keep(now, server.bytes, tables);
    const from = historyStart(now);
    const [readings, flights] = await Promise.all([
      this.sources.history.readings(from),
      this.sources.history.flightsPerDay(from),
    ]);
    return {
      generatedAt: now.toISOString(),
      // "16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)": the number is enough.
      server: { version: `PostgreSQL ${server.version.split(" ")[0]}`, name: server.name },
      totalBytes: server.bytes,
      tables: tables.map((table) => toTable(table, shares)),
      migrations: migrationStates(migrationFiles, recorded),
      cleanup,
      history: historyDays(now, readings, flights),
    };
  }

  /** Today's size reading (every hour, by SizeRecorder): the charts need one per day. */
  async record(): Promise<void> {
    const { repository } = this.sources;
    const [server, tables] = await Promise.all([repository.server(), repository.tables()]);
    await this.keep(this.now(), server.bytes, tables);
  }

  /** Records the reading of the day, then forgets those older than 13 months. */
  private async keep(now: Date, totalBytes: number, tables: readonly TableSize[]): Promise<void> {
    const sizes = Object.fromEntries(tables.map((table) => [table.name, table.totalBytes]));
    await this.sources.history.record({ day: utcDay(now), totalBytes, tables: sizes }, now);
    await this.sources.history.prune(utcDay(now, KEEP_READINGS_DAYS));
  }

  /** Deletes what is asked; real flights are never part of it (EF-14). */
  async cleanup(request: DatabaseCleanupRequest): Promise<DatabaseCleanupResult> {
    const now = this.now();
    const { flights, accounts } = this.sources;
    return {
      simulatedFlights: request.simulatedFlights
        ? await flights.deleteSimulatedBefore(simulatedLimit(now))
        : 0,
      expiredSessions: request.expiredSessions ? await accounts.deleteExpiredSessions(now) : 0,
      expiredInvitations: request.expiredInvitations
        ? await accounts.deleteExpiredInvitations(now)
        : 0,
    };
  }

  private async preview(now: Date): Promise<DatabaseCleanupPreview> {
    const [simulatedFlights, expired] = await Promise.all([
      this.sources.flights.simulatedBefore(simulatedLimit(now)),
      this.sources.accounts.countExpired(now),
    ]);
    return {
      olderThanDays: CLEANUP_SIMULATED_AFTER_DAYS,
      simulatedFlights,
      expiredSessions: expired.sessions,
      expiredInvitations: expired.invitations,
    };
  }
}

/** Simulated flights opened before this date can be cleaned up. */
const simulatedLimit = (now: Date) =>
  new Date(now.getTime() - CLEANUP_SIMULATED_AFTER_DAYS * DAY_MS);
