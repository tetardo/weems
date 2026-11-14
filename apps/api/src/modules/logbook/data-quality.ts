/**
 * How far a recorded value can be trusted on one flight (fiche 022). Many simulator variables
 * depend on the aircraft: on some add-ons they stay null or never move. A mark relies only on a
 * live value, so that a dead variable never counts against the pilot.
 *
 * - live: known and changing during the flight (or steady at its normal value, see `steady`);
 * - frozen: known but the same from the first point to the last;
 * - absent: never known (not given by the simulator, or not recorded by an older tracker).
 */
export type Quality = "live" | "frozen" | "absent";

/**
 * Quality of one field over a flight, from its value at each point (null or undefined: unknown).
 * `steady`: a value that may legitimately last the whole flight (an alarm that never sounds); the
 * field is then live when it holds that value throughout.
 */
export function qualityOf(
  values: readonly (boolean | number | null | undefined)[],
  steady?: boolean | number,
): Quality {
  const known = values.filter((v): v is boolean | number => v !== null && v !== undefined);
  const first = known[0];
  if (first === undefined) return "absent";
  if (known.some((v) => v !== first)) return "live";
  return first === steady ? "live" : "frozen";
}

/** The field was sent at all: false on flights recorded before the tracker sent it. */
export const recorded = (values: readonly unknown[]): boolean =>
  values.some((v) => v !== undefined);
