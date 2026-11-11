/** What a form holds, field by field: text values only (a chosen file is not a setting). */
export type FormSnapshot = ReadonlyMap<string, string>;

/** The values of a form, the same way the browser would send them. */
export function snapshotOf(data: FormData): FormSnapshot {
  const values = new Map<string, string>();
  for (const [name, value] of data) {
    if (typeof value === "string") values.set(name, `${values.get(name) ?? ""}${value}`);
  }
  return values;
}

/**
 * How many fields differ between two states of a form. A field present in one state only
 * counts too: a box ticked, or a field shown, since then.
 */
export function countChanges(before: FormSnapshot, after: FormSnapshot): number {
  const names = new Set([...before.keys(), ...after.keys()]);
  return [...names].filter((name) => before.get(name) !== after.get(name)).length;
}
