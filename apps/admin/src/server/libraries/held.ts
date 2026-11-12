/**
 * Updates held back on purpose: the page still shows the gap, with the reason, so that a known
 * delay is not mistaken for a forgotten one. A library leaves the list when its reason ends.
 */
const HELD_LIBRARIES: Readonly<Record<string, { major: number; reason: string }>> = {
  "@types/node": { major: 24, reason: "suit Node 24 (.nvmrc)" },
};

/** The reason when `latest` goes beyond the major held for this library, null otherwise. */
export function heldReason(name: string, latestMajor: number | null): string | null {
  const held = HELD_LIBRARIES[name];
  if (!held || latestMajor === null || latestMajor <= held.major) return null;
  return held.reason;
}
