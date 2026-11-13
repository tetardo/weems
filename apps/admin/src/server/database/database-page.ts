import type { AdminDatabase } from "@weems/contrats";
import type { ConsoleConfig } from "../console-config.ts";
import { type BackupFile, Backups, restoreCommand } from "./backups.ts";
import { applyMigrations } from "./migrator.ts";

/** What the page Base de données shows: the API's reading and what the console keeps itself. */
export interface DatabaseView {
  database: AdminDatabase;
  backups: (BackupFile & { restore: string })[];
  backingUp: boolean;
  migrating: boolean;
}

/**
 * The console's side of the page Base de données (spec admin): backups (pg_dump) and « Appliquer
 * les migrations ». Sizes, their history, migrations and cleanup come from the API.
 */
export class DatabasePage {
  private readonly config: ConsoleConfig;
  private readonly backups: Backups;
  private migrating: Promise<string> | null = null;

  constructor(config: ConsoleConfig) {
    this.config = config;
    this.backups = new Backups(config);
  }

  /** Adds the backups to the API's reading (which brings the size history itself). */
  async view(database: AdminDatabase): Promise<DatabaseView> {
    const backups = await this.backups.list();
    return {
      database,
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
