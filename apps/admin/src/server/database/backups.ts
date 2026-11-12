import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { composeFile } from "../services/docker.ts";

/** Backups kept: the oldest beyond are deleted after each new one. */
const KEEP_BACKUPS = 7;

/** User and database of the container (apps/api/docker-compose.yml). */
const DATABASE = "weems";
const NAME = /^weems-\d{4}-\d{2}-\d{2}-\d{6}\.dump$/;

export interface BackupFile {
  name: string;
  bytes: number;
  createdAt: string;
}

/** « weems-2026-11-12-074215.dump », in the Mac's local time: sorts by date. */
export function backupName(at: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
  return `weems-${day}-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}.dump`;
}

/** Backups beyond the `keep` newest; files of another name are never touched. */
export function backupsToDelete(names: readonly string[], keep = KEEP_BACKUPS): string[] {
  return names
    .filter((name) => NAME.test(name))
    .sort()
    .reverse()
    .slice(keep);
}

/** The command to restore one, shown on the page: it replaces the database, so never a button. */
export const restoreCommand = (name: string) =>
  `docker compose -f apps/api/docker-compose.yml exec -T db pg_restore -U ${DATABASE} -d ${DATABASE} --clean --if-exists < apps/admin/.data/backups/${name}`;

/** Runs pg_dump in the database container, its output written to `path` (fully, on success). */
async function dump(repoRoot: string, path: string): Promise<void> {
  const args = ["compose", "-f", composeFile(repoRoot), "exec", "-T", "db"];
  const child = spawn("docker", [...args, "pg_dump", "-U", DATABASE, "-Fc", DATABASE]);
  const errors: string[] = [];
  child.stderr.on("data", (chunk: Buffer) => errors.push(chunk.toString()));
  const exited = new Promise<number | null>((resolve, reject) => {
    child.on("error", reject);
    child.on("close", resolve);
  });
  const [, code] = await Promise.all([pipeline(child.stdout, createWriteStream(path)), exited]);
  if (code !== 0) throw new Error(errors.join("").trim() || `pg_dump s'est arrêté (code ${code}).`);
}

/**
 * Backups of the local database (spec admin, page Base de données): pg_dump in the container,
 * custom format, in apps/admin/.data/backups. Reading only: the console never restores.
 */
export class Backups {
  private readonly repoRoot: string;
  private readonly folder: string;
  private running: Promise<BackupFile> | null = null;

  constructor(config: { repoRoot: string; dataDir: string }) {
    this.repoRoot = config.repoRoot;
    this.folder = join(config.dataDir, "backups");
  }

  get isRunning(): boolean {
    return this.running !== null;
  }

  /** Newest first. */
  async list(): Promise<BackupFile[]> {
    const names = await readdir(this.folder).catch(() => [] as string[]);
    const files = await Promise.all(
      names
        .filter((name) => NAME.test(name))
        .map(async (name) => {
          const info = await stat(join(this.folder, name));
          return { name, bytes: info.size, createdAt: info.mtime.toISOString() };
        }),
    );
    return files.sort((a, b) => b.name.localeCompare(a.name));
  }

  /** One backup at a time; a second click waits for the first one. */
  create(): Promise<BackupFile> {
    this.running ??= this.write().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async write(): Promise<BackupFile> {
    await mkdir(this.folder, { recursive: true });
    const name = backupName(new Date());
    const partial = join(this.folder, `${name}.part`);
    try {
      await dump(this.repoRoot, partial);
      await rename(partial, join(this.folder, name));
    } finally {
      await rm(partial, { force: true });
    }
    const names = await readdir(this.folder);
    await Promise.all(backupsToDelete(names).map((old) => rm(join(this.folder, old))));
    const info = await stat(join(this.folder, name));
    return { name, bytes: info.size, createdAt: info.mtime.toISOString() };
  }
}
