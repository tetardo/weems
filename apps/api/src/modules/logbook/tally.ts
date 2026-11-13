/** Items grouped by a key, in the order the keys are first met. */
export function groupBy<T, K>(items: readonly T[], keyOf: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}

/** Mean of some numbers; null when there are none. */
export const meanOf = (values: readonly number[]): number | null =>
  values.length === 0 ? null : values.reduce((total, v) => total + v, 0) / values.length;
