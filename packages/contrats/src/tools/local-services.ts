import { z } from "zod";

/**
 * Route /api/lifecycle of the admin console, called on the Mac by the scripts of scripts/mac/ and by
 * the Mac launcher (apps/launcher, fiche 019). Not an API format: a contract between two local
 * programs.
 */

/** Header the local programs send: a web page cannot add it without a CORS preflight, refused. */
export const LOCAL_SCRIPT_HEADER = "x-weems-local-script";

export const LocalServiceId = z.enum(["db", "api", "site"]);
export type LocalServiceId = z.infer<typeof LocalServiceId>;

export const LifecycleRequest = z.union([
  z.object({ action: z.enum(["start-all", "stop-all"]) }),
  z.object({ action: z.enum(["start", "stop", "restart"]), service: LocalServiceId }),
]);
export type LifecycleRequest = z.infer<typeof LifecycleRequest>;

export const LocalServiceStatus = z.object({
  id: LocalServiceId,
  state: z.enum(["running", "starting", "stopped", "error"]),
  /** Who runs it: the console (pnpm dev), Docker, or a launch the console did not make. */
  runner: z.enum(["console", "docker", "outside"]).nullable(),
  port: z.number().int().positive(),
  /** Start time, when the console started it. */
  since: z.string().nullable(),
  error: z.string().nullable(),
});
export type LocalServiceStatus = z.infer<typeof LocalServiceStatus>;

/** GET /api/lifecycle[?logs=<service>]: the services, and the last lines of one when asked. */
export const LifecycleStatus = z.object({
  services: z.array(LocalServiceStatus),
  dockerAvailable: z.boolean(),
  logs: z.array(z.string()).nullable(),
});
export type LifecycleStatus = z.infer<typeof LifecycleStatus>;
