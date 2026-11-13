import { LiveActivityLine, PopulationLine } from "@weems/contrats";
import type { ConsoleConfig } from "../console-config.ts";
import { ManagedProcess } from "@weems/local-process";
import type { ActivityRun, ActivityView } from "./activity-view.ts";
import { FictitiousApi } from "./fictitious-api.ts";
import { type ActivityLaunch, pnpmArgsOf, summaryOf } from "./launch.ts";
import { outcomeOf } from "./outcome.ts";

/** Time left to a stopped run: the live activity closes its flights as interrupted. */
const STOP_GRACE_MS = 45_000;

function readLine(run: ActivityRun, line: string): void {
  if (!line.startsWith("{")) return;
  const schema = run.launch.kind === "population" ? PopulationLine : LiveActivityLine;
  const parsed = schema.safeParse(JSON.parse(line));
  if (!parsed.success) return; // Not a progress line: it stays in the logs.
  const { type, ...content } = parsed.data;
  if (type === "progress") run.progress = content as ActivityRun["progress"];
  else run.result = content as ActivityRun["result"];
}

function safeReadLine(run: ActivityRun, line: string): void {
  try {
    readLine(run, line);
  } catch {
    // A line starting with « { » that is not JSON: it stays in the logs.
  }
}

/**
 * Page Activité simulée (console spec): creates the fictitious population or runs the live
 * activity with `pnpm populate`, one run at a time, shared with the page Trafic simulé.
 */
export class ActivityRunner {
  private readonly config: ConsoleConfig;
  private readonly api: FictitiousApi;
  private readonly trafficBusy: () => boolean;
  private run: ActivityRun | null = null;
  private process: ManagedProcess | null = null;

  constructor(config: ConsoleConfig, trafficBusy: () => boolean) {
    this.config = config;
    this.api = new FictitiousApi(config);
    this.trafficBusy = trafficBusy;
  }

  isBusy(): boolean {
    return this.run !== null && this.run.state !== "ended";
  }

  start(launch: ActivityLaunch): void {
    if (this.isBusy()) throw new Error("Un lancement est déjà en cours.");
    if (this.trafficBusy()) throw new Error("Un lancement est en cours sur la page Trafic simulé.");
    const run: ActivityRun = {
      launch,
      summary: summaryOf(launch),
      startedAt: new Date().toISOString(),
      endedAt: null,
      state: "running",
      progress: null,
      result: null,
      outcome: null,
      lastLines: [],
    };
    const process = new ManagedProcess((line) => safeReadLine(run, line));
    process.start("pnpm", pnpmArgsOf(launch, this.config), this.config.repoRoot);
    this.run = run;
    this.process = process;
    void process.wait().then(() => this.finish(run, process));
  }

  private finish(run: ActivityRun, process: ManagedProcess): void {
    run.outcome = outcomeOf(process.status().exitCode, run.state === "stopping", run.result);
    run.state = "ended";
    run.endedAt = new Date().toISOString();
    if (run.outcome === "failed") {
      run.lastLines = process.logs
        .all()
        .filter((line) => !line.startsWith("{"))
        .slice(-20);
    }
  }

  /** Keeps what is already created; the live activity closes its flights as interrupted. */
  async stop(): Promise<void> {
    if (!this.run || this.run.state !== "running" || !this.process) return;
    this.run.state = "stopping";
    await this.process.stop(STOP_GRACE_MS);
  }

  async view(): Promise<ActivityView> {
    const population = await this.api.population();
    const { pilotIds: _ids, ...counts } = population ?? { pilotIds: [] };
    return {
      run: this.run,
      population: population ? (counts as ActivityView["population"]) : null,
      trafficBusy: this.trafficBusy(),
    };
  }

  async deleteAll(): Promise<void> {
    if (this.isBusy()) throw new Error("Arrêtez d'abord le lancement en cours.");
    await this.api.deleteAll();
  }
}
