import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

/**
 * Sizes of the database, one reading per day, kept by the console (apps/admin/.data) so the page
 * Base de données shows how much each table grew over 7 days. Neither a table nor an API route.
 */
const snapshotSchema = z.object({
  /** Local day of the Mac, YYYY-MM-DD. */
  date: z.iso.date(),
  totalBytes: z.number(),
  tables: z.record(z.string(), z.number()),
});
export type SizeSnapshot = z.infer<typeof snapshotSchema>;

/** Growth since a past reading: `since` is its day (7 days ago, or the oldest one kept). */
export interface SizeGrowth {
  since: string;
  totalBytes: number;
  tables: Record<string, number>;
}

const KEEP_DAYS = 31;
const WINDOW_DAYS = 7;

/** YYYY-MM-DD of a local day, `daysBack` days before this one. */
export function localDay(at: Date, daysBack = 0): string {
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate() - daysBack);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/** The history with today's reading (replacing an earlier one of the same day), oldest first. */
export function withSnapshot(history: SizeSnapshot[], snapshot: SizeSnapshot): SizeSnapshot[] {
  const others = history.filter((kept) => kept.date !== snapshot.date);
  return [...others, snapshot].sort((a, b) => a.date.localeCompare(b.date)).slice(-KEEP_DAYS);
}

/**
 * Growth of today's reading since the last one at least 7 days old; without one, since the
 * oldest reading before today; null when today is the first.
 */
export function growthOf(history: SizeSnapshot[], today: SizeSnapshot): SizeGrowth | null {
  const limit = localDay(new Date(`${today.date}T12:00:00`), WINDOW_DAYS);
  const past = history.filter((kept) => kept.date < today.date);
  const reference = past.filter((kept) => kept.date <= limit).at(-1) ?? past[0];
  if (!reference) return null;
  const tables: Record<string, number> = {};
  for (const [name, bytes] of Object.entries(today.tables))
    tables[name] = bytes - (reference.tables[name] ?? 0);
  return {
    since: reference.date,
    totalBytes: today.totalBytes - reference.totalBytes,
    tables,
  };
}

/** The readings in apps/admin/.data/database-sizes.json. */
export class SizeHistory {
  private readonly path: string;

  constructor(dataDir: string) {
    this.path = join(dataDir, "database-sizes.json");
  }

  /** Records today's reading and returns the growth over 7 days. */
  async record(today: SizeSnapshot): Promise<SizeGrowth | null> {
    const history = await this.read();
    await mkdir(join(this.path, ".."), { recursive: true });
    await writeFile(this.path, JSON.stringify(withSnapshot(history, today), null, 2));
    return growthOf(history, today);
  }

  /** A missing or unreadable file is an empty history. */
  private async read(): Promise<SizeSnapshot[]> {
    try {
      return z.array(snapshotSchema).parse(JSON.parse(await readFile(this.path, "utf8")));
    } catch {
      return [];
    }
  }
}
