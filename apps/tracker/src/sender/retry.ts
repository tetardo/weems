/** Delays between attempts (architecture interne, part 4): 2 s, 5 s, 15 s… up to 5 min. */
const STEPS_MS = [2_000, 5_000, 15_000, 30_000, 60_000, 120_000, 300_000];

/** Delay before attempt number `attempts + 1`, with up to 20 % random jitter. */
export function retryDelayMs(attempts: number, random: () => number): number {
  const base = STEPS_MS[Math.min(attempts, STEPS_MS.length) - 1] ?? STEPS_MS[0] ?? 2_000;
  return Math.round(base * (1 + 0.2 * random()));
}

export type ResponseAction = "done" | "retry" | "park" | "unauthorized" | "upgradeRequired";

/** What to do with a queued message after the API answered (architecture interne, part 4). */
export function actionFor(status: number | "networkError"): ResponseAction {
  if (status === "networkError" || status >= 500) return "retry";
  if (status === 200 || status === 201) return "done";
  if (status === 401) return "unauthorized";
  if (status === 426) return "upgradeRequired";
  return "park";
}
