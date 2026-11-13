import { type LifecycleRequest, type LifecycleStatus, LOCAL_SCRIPT_HEADER } from "@weems/contrats";
import { activity, services, traffic } from "./console.ts";

/**
 * A request from the programs of the Mac (scripts/mac/, the launcher apps/launcher), not from a web
 * page: the custom header is there, and a browser's Origin, if any, is the console's own address.
 */
export function isLocalScriptRequest(headers: Headers, consoleUrl: string): boolean {
  if (headers.get(LOCAL_SCRIPT_HEADER) !== "1") return false;
  const origin = headers.get("origin");
  return origin === null || origin === new URL(consoleUrl).origin;
}

/** The services as the launcher shows them, and the last lines of one service when asked. */
export async function lifecycleStatus(logsOf: string | null): Promise<LifecycleStatus> {
  const view = await services().view();
  const wanted = view.services.find((service) => service.id === logsOf);
  return {
    services: view.services.map(({ id, state, runner, port, since, error }) => ({
      id,
      state,
      runner,
      port,
      since,
      error,
    })),
    dockerAvailable: view.dockerAvailable,
    logs: wanted ? await services().logs(wanted.id) : null,
  };
}

/**
 * Start (icon or launcher): the database, the API and the site, as the « Tout démarrer » button does.
 * Stop: the simulation or simulated activity in progress first (flights closed as interrupted),
 * then the site, the API and the database. The console itself is stopped by the script.
 * One service: as its buttons on the page Services.
 */
export async function runLifecycle(request: LifecycleRequest): Promise<void> {
  if ("service" in request) return services()[request.action](request.service);
  if (request.action === "start-all") return services().startAll();
  await traffic().stop();
  await activity().stop();
  await services().stopAll();
}
