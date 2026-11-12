import type { Probe } from "./probes.ts";

export type ServiceId = "db" | "api" | "site";

export type ServiceState = "running" | "starting" | "stopped" | "error";
/** Who runs it: the console (pnpm dev), Docker, or something the console did not start. */
export type Runner = "console" | "docker" | "outside";
/** How the console starts the API (spec admin): pnpm dev by default, or its Docker container. */
export type ApiMode = "dev" | "docker";

/** A program that holds the port while the service does not answer (old launch, other app). */
export interface PortHolder {
  message: string;
  /** « le conteneur Docker « weems-api-1 » », « le processus 4211 (…) »; null if unknown. */
  owner: string | null;
  /** An old Weems launch: the console may stop it (« Libérer et démarrer », after a confirmation). */
  freeable: boolean;
}

export interface ServiceView {
  id: ServiceId;
  state: ServiceState;
  runner: Runner | null;
  port: number;
  health: Probe;
  pid: number | null;
  /** Start time, when the console started it. */
  since: string | null;
  /** Docker's own words about the container, if any. */
  container: string | null;
  error: string | null;
  holder: PortHolder | null;
}

export interface ServicesView {
  services: ServiceView[];
  apiMode: ApiMode;
  dockerAvailable: boolean;
}
