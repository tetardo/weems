import type { ConsoleConfig } from "../console-config.ts";
import { ManagedProcess } from "@weems/local-process";
import { type ContainerState, DockerCompose, type DockerState } from "./docker.ts";
import { portHolder, releasePort } from "./port-guard.ts";
import { type Probe, probeHttp, probePort } from "./probes.ts";
import { stateOf } from "./service-state.ts";
import type { ApiMode, ServiceId, ServicesView, ServiceView } from "./service-view.ts";

const PORTS: Record<ServiceId, number> = { db: 5432, api: 3000, site: 3001 };
/** Only the site (next dev) has a lock besides its port. */
const usesNextLock = (id: ServiceId) => id === "site";
/** pnpm scripts started by the console, from the root of the repository. */
const DEV_COMMANDS = {
  api: ["--filter", "@weems/api", "dev"],
  site: ["--filter", "@weems/web", "dev"],
} as const;

function viewOf(
  id: ServiceId,
  probe: Probe,
  managed: ManagedProcess | null,
  container: ContainerState | undefined,
): ServiceView {
  const process = managed ? managed.status() : null;
  const lastLine = managed ? (managed.logs.all().at(-1) ?? null) : null;
  const shown = stateOf({ probe, process, container, lastLine, nowMs: Date.now() });
  return {
    id,
    ...shown,
    port: PORTS[id],
    health: probe,
    pid: process ? process.pid : null,
    since: process && process.running ? process.startedAt : null,
    container: container ? container.status : null,
    holder: null,
  };
}

/**
 * Page Services (console spec): the database in Docker, the API (pnpm dev or Docker) and the site
 * (pnpm dev). The console only stops what it or Docker started.
 */
export class ServicesManager {
  private readonly config: ConsoleConfig;
  private readonly docker: DockerCompose;
  private readonly processes = { api: new ManagedProcess(), site: new ManagedProcess() };
  private apiMode: ApiMode = "dev";

  constructor(config: ConsoleConfig) {
    this.config = config;
    this.docker = new DockerCompose(config.repoRoot);
  }

  async view(): Promise<ServicesView> {
    const [docker, db, api, site] = await Promise.all([
      this.docker.state(),
      probePort(PORTS.db),
      probeHttp(`${this.config.apiUrl}/v1/health`),
      probeHttp(`${this.config.siteUrl}/fr/login`),
    ]);
    if (docker.containers.api?.running) this.apiMode = "docker";
    const probes: Record<ServiceId, Probe> = { db, api, site };
    const views = (["db", "api", "site"] as const).map((id) => this.viewOf(id, probes[id], docker));
    return {
      services: await Promise.all(views),
      apiMode: this.apiMode,
      dockerAvailable: docker.available,
    };
  }

  private async viewOf(id: ServiceId, probe: Probe, docker: DockerState): Promise<ServiceView> {
    const managed = id === "db" ? null : this.processes[id];
    const container = id === "site" ? undefined : docker.containers[id];
    const view = viewOf(id, probe, managed, container);
    // Only a service down whose port is open (or site lock held) has a holder: lsof runs then only.
    if (id === "db" || view.state === "running" || view.state === "starting") return view;
    const holder = await portHolder(PORTS[id], this.config.repoRoot, usesNextLock(id));
    // A Weems launch that does not answer yet (pnpm dev compiles its first page): starting.
    if (holder?.freeable) return { ...view, state: "starting", runner: "outside", holder };
    return { ...view, holder };
  }

  async start(id: ServiceId): Promise<void> {
    const current = (await this.view()).services.find((service) => service.id === id);
    if (current?.state === "running" || current?.state === "starting") return;
    if (id === "db") return this.docker.up("db");
    if (id === "api" && this.apiMode === "docker") return this.docker.up("api");
    const holder = await portHolder(PORTS[id], this.config.repoRoot, usesNextLock(id));
    if (holder) throw new Error(holder.message);
    this.processes[id].start("pnpm", DEV_COMMANDS[id], this.config.repoRoot);
  }

  /** « Libérer »: stops the old Weems launch holding the port (or site lock), then starts. */
  async freePortAndStart(id: "api" | "site"): Promise<void> {
    await releasePort(PORTS[id], this.config.repoRoot, usesNextLock(id));
    await this.start(id);
  }

  async stop(id: ServiceId): Promise<void> {
    const current = (await this.view()).services.find((service) => service.id === id);
    if (current?.runner === "outside") {
      throw new Error("Lancé hors de la console : arrêtez-le dans son terminal.");
    }
    if (current?.runner === "docker" && id !== "site") return this.docker.stop(id);
    if (id !== "db") await this.processes[id].stop();
  }

  async restart(id: ServiceId): Promise<void> {
    await this.stop(id);
    await this.start(id);
  }

  /** Switches the API between pnpm dev and Docker: stops one, starts the other. */
  async setApiMode(mode: ApiMode): Promise<void> {
    if (mode === this.apiMode) return;
    await this.stop("api");
    this.apiMode = mode;
    await this.start("api");
  }

  async startAll(): Promise<void> {
    for (const id of ["db", "api", "site"] as const) await this.start(id);
  }

  async stopAll(): Promise<void> {
    for (const id of ["site", "api", "db"] as const) {
      const current = (await this.view()).services.find((service) => service.id === id);
      if (current?.runner === "console" || current?.runner === "docker") await this.stop(id);
    }
  }

  async logs(id: ServiceId): Promise<string[]> {
    if (id === "db") return this.docker.logs("db");
    if (id === "api" && this.apiMode === "docker") return this.docker.logs("api");
    return this.processes[id].logs.all();
  }
}
