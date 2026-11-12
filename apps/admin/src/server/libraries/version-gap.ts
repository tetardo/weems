import type { VersionGap } from "./report.ts";

/** "1.7.20" → [1, 7, 20]; null for anything that is not a plain release (tag, range, link). */
function parse(version: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/**
 * Size of the update from `installed` to `latest`, as semantic versioning means it.
 * Below 1.0 a minor step may break (0.34 → 0.35): it counts as major.
 */
export function versionGap(installed: string, latest: string): VersionGap {
  const from = parse(installed);
  const to = parse(latest);
  if (!from || !to) return "current";
  const [major, minor, patch] = from;
  const [toMajor, toMinor, toPatch] = to;
  if (toMajor !== major) return toMajor > major ? "major" : "current";
  if (toMinor !== minor) return toMinor < minor ? "current" : major === 0 ? "major" : "minor";
  return toPatch > patch ? "patch" : "current";
}

/** Major number of a plain release, null otherwise. */
export function majorOf(version: string): number | null {
  return parse(version)?.[0] ?? null;
}

/** An update below 1.0, shown « majeure (0.x) ». */
export const isZeroMajor = (installed: string) => majorOf(installed) === 0;

/** Order of plain releases, lowest first (anything else comes last). */
export function compareVersions(a: string, b: string): number {
  const left = parse(a);
  const right = parse(b);
  if (!left || !right) return left ? -1 : right ? 1 : 0;
  return left[0] - right[0] || left[1] - right[1] || left[2] - right[2];
}

/** The lowest of plain releases. */
export const lowestVersion = (versions: readonly string[]) =>
  [...versions].sort(compareVersions)[0] ?? "";
