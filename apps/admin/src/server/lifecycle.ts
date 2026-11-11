import { services, traffic } from "./console.ts";

/** What the desktop scripts (scripts/mac/start.sh, stop.sh) ask the console. */
export type LifecycleAction = "start-all" | "stop-all";

/** Header the scripts send: a page in a browser cannot add it without a CORS preflight, refused. */
export const LOCAL_SCRIPT_HEADER = "x-weems-local-script";

/**
 * A request from the scripts on the Mac, not from a web page: the custom header is there, and a
 * browser's Origin, if any, is the console's own address.
 */
export function isLocalScriptRequest(headers: Headers, adminUrl: string): boolean {
  if (headers.get(LOCAL_SCRIPT_HEADER) !== "1") return false;
  const origin = headers.get("origin");
  return origin === null || origin === new URL(adminUrl).origin;
}

export function parseAction(body: unknown): LifecycleAction | null {
  if (typeof body !== "object" || body === null) return null;
  const action = (body as { action?: unknown }).action;
  return action === "start-all" || action === "stop-all" ? action : null;
}

/**
 * Icône Start: the database, the API and the site, as the « Tout démarrer » button does.
 * Icône Stop: the simulation in progress first (its flights are closed as interrupted), then the
 * site, the API and the database. The console itself is stopped by the script.
 */
export async function runLifecycle(action: LifecycleAction): Promise<void> {
  if (action === "start-all") return services().startAll();
  await traffic().stop();
  await services().stopAll();
}
