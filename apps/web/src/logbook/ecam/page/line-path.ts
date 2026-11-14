/**
 * SVG path through the known values of a row, one point per cell in the middle of it: `x` places
 * a cell, `y` a value; missing values are skipped.
 */
export function linePath(
  values: readonly (number | null)[],
  x: (i: number) => number,
  y: (v: number) => number,
): string {
  return values
    .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
    .filter((p): p is string => p !== null)
    .map((p, i) => `${i ? "L" : "M"}${p}`)
    .join("");
}
