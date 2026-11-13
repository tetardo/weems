import { statfs } from "node:fs/promises";
import type { LauncherOverview } from "@weems/contrats";
import type { ConsoleConfig } from "./console-config.ts";
import { Backups } from "./database/backups.ts";

/** Card « Fichiers » of the Mac launcher: the console's backups and the Mac's disk. */
export async function launcherFiles(config: ConsoleConfig): Promise<LauncherOverview["files"]> {
  const [backups, disk] = await Promise.all([
    new Backups(config).list(),
    statfs(config.repoRoot).catch(() => null),
  ]);
  return {
    backups: {
      count: backups.length,
      bytes: backups.reduce((sum, file) => sum + file.bytes, 0),
      lastAt: backups[0]?.createdAt ?? null,
    },
    disk: disk && {
      usedBytes: (disk.blocks - disk.bfree) * disk.bsize,
      totalBytes: disk.blocks * disk.bsize,
    },
  };
}
