/**
 * Values grouped by time slot (one hour, one minute…), kept for the last `keep` slots only.
 * Memory stays bounded whatever the traffic: at most `keep` buckets live at once.
 */
export class RollingBuckets<T> {
  private readonly slotMs: number;
  private readonly keep: number;
  private readonly create: () => T;
  private readonly buckets = new Map<number, T>();

  constructor(options: { slotMs: number; keep: number; create: () => T }) {
    this.slotMs = options.slotMs;
    this.keep = options.keep;
    this.create = options.create;
  }

  /** The bucket of the slot holding `atMs`, created on first use. */
  at(atMs: number): T {
    const slot = Math.floor(atMs / this.slotMs);
    let bucket = this.buckets.get(slot);
    if (!bucket) {
      bucket = this.create();
      this.buckets.set(slot, bucket);
      this.forgetBefore(slot - this.keep + 1);
    }
    return bucket;
  }

  /** The last `keep` slots up to the one holding `nowMs`, oldest first; null for an empty slot. */
  window(nowMs: number): (T | null)[] {
    const last = Math.floor(nowMs / this.slotMs);
    return Array.from(
      { length: this.keep },
      (_, i) => this.buckets.get(last - this.keep + 1 + i) ?? null,
    );
  }

  private forgetBefore(slot: number): void {
    for (const key of this.buckets.keys()) if (key < slot) this.buckets.delete(key);
  }
}
