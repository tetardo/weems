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
import { migrationStates } from "./migration-states.ts";
import type { DatabaseRepository, SimulatedShares, TableSize } from "./repository.ts";

export interface DatabaseSources {
  repository: DatabaseRepository;
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
    return {
      generatedAt: now.toISOString(),
      // "16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)": the number is enough.
      server: { version: `PostgreSQL ${server.version.split(" ")[0]}`, name: server.name },
      totalBytes: server.bytes,
      tables: tables.map((table) => toTable(table, shares)),
      migrations: migrationStates(migrationFiles, recorded),
      cleanup,
    };
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
