import { ApiProblem } from "./problem.ts";

/** Header sent by every client: "tracker/0.1.0". */
export const CLIENT_HEADER = "weems-client";

function parseVersion(version: string): number[] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? match.slice(1).map(Number) : null;
}

function isOlder(version: number[], minimum: number[]): boolean {
  for (let i = 0; i < 3; i++) {
    const a = version[i] ?? 0;
    const b = minimum[i] ?? 0;
    if (a !== b) return a < b;
  }
  return false;
}

/**
 * Checks the Weems-Client header of a tracker request:
 * 400 when missing or malformed, 426 when the tracker is older than the minimum.
 */
export function assertTrackerVersion(header: string | undefined, minimum: string): void {
  const [client, raw] = (header ?? "").split("/");
  const version = raw ? parseVersion(raw) : null;
  if (client !== "tracker" || !version) {
    throw new ApiProblem(400, "Bad Request", 'Header Weems-Client must look like "tracker/1.2.3".');
  }
  const min = parseVersion(minimum);
  if (min && isOlder(version, min)) {
    throw new ApiProblem(
      426,
      "Upgrade Required",
      `Tracker ${raw} is too old: update to ${minimum} or later.`,
    );
  }
}
