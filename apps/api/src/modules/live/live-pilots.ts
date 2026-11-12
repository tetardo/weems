import { isDeepStrictEqual } from "node:util";
import type { LivePilot } from "@weems/contrats";

/** Public pilots among these ids, by pilot id (implemented by the profiles module). */
export type LoadPilots = (pilotIds: string[]) => Promise<ReadonlyMap<string, LivePilot>>;

/**
 * Every known pilot is read again this often: a pilot who turns their profile off disappears
 * from the map within this delay (spec J4, carte en direct).
 */
export const REFRESH_EVERY_MS = 30_000;

/**
 * Public identity of the pilots on the live map, kept in memory: positions arrive every few
 * seconds and must not cost a database read each.
 */
export class LivePilots {
  private readonly load: LoadPilots;
  private readonly now: () => number;
  private readonly known = new Map<string, LivePilot | null>();
  private loadedAt = -Infinity;
  /** A slow database must not pile up reads: one at a time, the next tick tries again. */
  private reading = false;

  constructor(load: LoadPilots, now: () => number = Date.now) {
    this.load = load;
    this.now = now;
  }

  /** The pilot as last read; null while unknown or when the profile is not public. */
  of(pilotId: string): LivePilot | null {
    return this.known.get(pilotId) ?? null;
  }

  /**
   * Reads the pilots never seen, and all of them every REFRESH_EVERY_MS; forgets those no
   * longer on the map. Returns the pilots whose public identity changed.
   */
  async refresh(pilotIds: Iterable<string>): Promise<Set<string>> {
    if (this.reading) return new Set();
    this.reading = true;
    try {
      return await this.read([...new Set(pilotIds)]);
    } finally {
      this.reading = false;
    }
  }

  private async read(ids: string[]): Promise<Set<string>> {
    const due = this.now() - this.loadedAt >= REFRESH_EVERY_MS;
    if (due) for (const id of this.known.keys()) if (!ids.includes(id)) this.known.delete(id);
    const wanted = due ? ids : ids.filter((id) => !this.known.has(id));
    if (wanted.length === 0) return new Set();
    const loaded = await this.load(wanted);
    if (due) this.loadedAt = this.now();
    const changed = new Set<string>();
    for (const id of wanted) {
      const next = loaded.get(id) ?? null;
      if (!isDeepStrictEqual(this.of(id), next)) changed.add(id);
      this.known.set(id, next);
    }
    return changed;
  }
}
