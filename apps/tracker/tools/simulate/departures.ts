/** A random gap is kept between these multiples of the mean: never two departures at once. */
const MIN_GAP = 0.15;
const MAX_GAP = 4;

/**
 * When each pilot pushes back, in simulated seconds after the start: `staggerS` apart, or, with
 * `random`, random gaps averaging `staggerS` (exponential, as independent pilots would: some
 * close together, some long waits), the first one at once.
 */
export function departureOffsetsS(
  count: number,
  staggerS: number,
  random?: () => number,
): number[] {
  let at = 0;
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return 0;
    if (!random) return index * staggerS;
    const gap = -Math.log(1 - random()) * staggerS;
    at += Math.min(MAX_GAP * staggerS, Math.max(MIN_GAP * staggerS, gap));
    return at;
  });
}
