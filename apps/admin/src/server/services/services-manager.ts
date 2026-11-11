import type { ConsoleConfig } from "../console-config.ts";
import { ManagedProcess } from "../managed-process.ts";
import { type ContainerState, DockerCompose, type DockerState } from "./docker.ts";
import { assertPortFree } from "./port-guard.ts";
import { type Probe, probeHttp, probePort } from "./probes.ts";
import { stateOf } from "./service-state.ts";
import type { ApiMode, ServiceId, ServicesView, ServiceView } from "./service-view.ts";

const PORTS: Record<ServiceId, number> = { db: 5432, api: 3000, site: 3001 };
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
  };
}

/**
 * Page Services (spec admin): the database in Docker, the API (pnpm dev or Docker) and the site
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
    return {
      services: (["db", "api", "site"] as const).map((id) => this.viewOf(id, probes[id], docker)),
      apiMode: this.apiMode,
      dockerAvailable: docker.available,
    };
  }

  private viewOf(id: ServiceId, probe: Probe, docker: DockerState): ServiceView {
    const managed = id === "db" ? null : this.processes[id];
    const container = id === "site" ? undefined : docker.containers[id];
    return viewOf(id, probe, managed, container);
  }

  async start(id: ServiceId): Promise<void> {
    const current = (await this.view()).services.find((service) => service.id === id);
    if (current?.state === "running" || current?.state === "starting") return;
    if (id === "db") return this.docker.up("db");
    if (id === "api" && this.apiMode === "docker") return this.docker.up("api");
    await assertPortFree(PORTS[id]);
    this.processes[id].start("pnpm", DEV_COMMANDS[id], this.config.repoRoot);
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
