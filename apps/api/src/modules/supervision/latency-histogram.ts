/** Upper bounds of the buckets, ms: from 1 ms to 30 s, each 25 % above the previous one. */
const BOUNDS_MS: readonly number[] = (() => {
  const bounds: number[] = [];
  for (let bound = 1; bound < 30_000; bound *= 1.25) bounds.push(Math.round(bound * 100) / 100);
  return bounds;
})();

/**
 * Response times counted in fixed buckets, so that a busy hour costs the same memory as a calm
 * one. The 95th percentile read from it is the bound of its bucket: right within 25 %.
 */
export class LatencyHistogram {
  private readonly counts = new Array<number>(BOUNDS_MS.length + 1).fill(0);
  private total = 0;

  record(durationMs: number): void {
    const found = BOUNDS_MS.findIndex((bound) => durationMs <= bound);
    const index = found === -1 ? BOUNDS_MS.length : found;
    this.counts[index] = (this.counts[index] ?? 0) + 1;
    this.total += 1;
  }

  /** The 95th percentile, ms; null without any request. Beyond 30 s: 30 s. */
  p95(): number | null {
    if (this.total === 0) return null;
    const rank = Math.ceil(this.total * 0.95);
    let seen = 0;
    for (const [index, count] of this.counts.entries()) {
      seen += count;
      if (seen >= rank) return BOUNDS_MS[index] ?? 30_000;
    }
    return 30_000;
  }
}
