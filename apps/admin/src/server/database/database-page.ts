import type { AdminDatabase } from "@weems/contrats";
import type { ConsoleConfig } from "../console-config.ts";
import { type BackupFile, Backups, restoreCommand } from "./backups.ts";
import { applyMigrations } from "./migrator.ts";
import { localDay, type SizeGrowth, SizeHistory } from "./size-history.ts";

/** What the page Base de données shows: the API's reading and what the console keeps itself. */
export interface DatabaseView {
  database: AdminDatabase;
  /** Growth over 7 days, from the daily readings of the console; null on the first day. */
  growth: SizeGrowth | null;
  backups: (BackupFile & { restore: string })[];
  backingUp: boolean;
  migrating: boolean;
}

/**
 * The console's side of the page Base de données (spec admin): daily size readings, backups
 * (pg_dump) and « Appliquer les migrations ». Sizes, migrations and cleanup come from the API.
 */
export class DatabasePage {
  private readonly config: ConsoleConfig;
  private readonly backups: Backups;
  private readonly history: SizeHistory;
  private migrating: Promise<string> | null = null;

  constructor(config: ConsoleConfig) {
    this.config = config;
    this.backups = new Backups(config);
    this.history = new SizeHistory(config.dataDir);
  }

  /** Records today's size reading, then adds growth and backups to the API's reading. */
  async view(database: AdminDatabase): Promise<DatabaseView> {
    const tables = Object.fromEntries(database.tables.map((t) => [t.name, t.totalBytes]));
    const growth = await this.history.record({
      date: localDay(new Date(database.generatedAt)),
      totalBytes: database.totalBytes,
      tables,
    });
    const backups = await this.backups.list();
    return {
      database,
      growth,
      backups: backups.map((file) => ({ ...file, restore: restoreCommand(file.name) })),
      backingUp: this.backups.isRunning,
      migrating: this.migrating !== null,
    };
  }

  backup(): Promise<BackupFile> {
    return this.backups.create();
  }

  /** One run at a time. Returns the command's last lines. */
  migrate(): Promise<string> {
    this.migrating ??= applyMigrations(this.config.repoRoot).finally(() => {
      this.migrating = null;
    });
    return this.migrating;
  }
}
