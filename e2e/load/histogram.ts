/**
 * Durations in fixed 10 ms buckets: millions of values in constant memory,
 * percentiles exact to 10 ms (enough for criteria in hundreds of ms or seconds).
 */
export class Histogram {
  private readonly bucketMs = 10;
  private readonly counts: number[] = [];
  private total = 0;
  private highest = 0;

  add(valueMs: number): void {
    const bucket = Math.max(0, Math.floor(valueMs / this.bucketMs));
    this.counts[bucket] = (this.counts[bucket] ?? 0) + 1;
    this.total += 1;
    this.highest = Math.max(this.highest, valueMs);
  }

  get count(): number {
    return this.total;
  }

  get max(): number {
    return this.highest;
  }

  /** Upper edge of the bucket holding the p-th percentile (0 when empty). */
  percentile(p: number): number {
    const rank = Math.ceil((p / 100) * this.total);
    let seen = 0;
    for (let bucket = 0; bucket < this.counts.length; bucket++) {
      seen += this.counts[bucket] ?? 0;
      if (seen >= rank && rank > 0) return (bucket + 1) * this.bucketMs;
    }
    return 0;
  }
}
