import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

/** Ended runs, newest first, in apps/console/.data (local to the Mac, never committed). */
export const HistoryEntry = z.object({
  id: z.string(),
  kind: z.enum(["simulate", "load"]),
  summary: z.string(),
  startedAt: z.string(),
  endedAt: z.string(),
  outcome: z.enum(["success", "failed", "stopped"]),
  /** « 1 critère raté »… */
  detail: z.string().nullable(),
});
export type HistoryEntry = z.infer<typeof HistoryEntry>;

const MAX_ENTRIES = 20;

export function withEntry(list: readonly HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...list.filter((old) => old.id !== entry.id)].slice(0, MAX_ENTRIES);
}

export class HistoryFile {
  private readonly path: string;

  constructor(dataDir: string) {
    this.path = join(dataDir, "traffic-history.json");
  }

  /** An unreadable file is an empty history: it only helps the eye. */
  async read(): Promise<HistoryEntry[]> {
    try {
      return z.array(HistoryEntry).parse(JSON.parse(await readFile(this.path, "utf8")));
    } catch {
      return [];
    }
  }

  async add(entry: HistoryEntry): Promise<void> {
    const list = withEntry(await this.read(), entry);
    await mkdir(join(this.path, ".."), { recursive: true });
    await writeFile(this.path, `${JSON.stringify(list, null, 2)}\n`);
  }
}
