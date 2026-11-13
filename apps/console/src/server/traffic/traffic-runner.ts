import { readFile } from "node:fs/promises";
import { SimulationLine } from "@weems/contrats";
import type { ConsoleConfig } from "../console-config.ts";
import { ManagedProcess } from "@weems/local-process";
import { DevApi } from "./dev-api.ts";
import { HistoryFile } from "./history.ts";
import { type Launch, pnpmArgsOf, reportFileOf, summaryOf } from "./launch.ts";
import { failedCriteria, outcomeOf } from "./outcome.ts";
import type { MetricsSample, RunView, TrafficView } from "./traffic-view.ts";

/** Readings kept for the small curves: 2 minutes at one reading every 2 s. */
const SERIES_SIZE = 60;
/** Time left to a stopped simulation to send the closing of its flights. */
const STOP_GRACE_MS = 30_000;

function readLine(run: RunView, line: string): void {
  if (!line.startsWith("{")) return;
  try {
    const parsed = SimulationLine.parse(JSON.parse(line));
    if (parsed.type === "progress") {
      const { type: _type, ...progress } = parsed;
      run.progress = progress;
    }
  } catch {
    // Not a progress line: it stays in the logs.
  }
}

/** Page Trafic simulé (console spec): one run at a time, pnpm simulate or pnpm load. */
export class TrafficRunner {
  private readonly config: ConsoleConfig;
  private readonly api: DevApi;
  private readonly history: HistoryFile;
  private run: RunView | null = null;
  private process: ManagedProcess | null = null;
  private series: MetricsSample[] = [];
  private readonly activityBusy: () => boolean;

  constructor(config: ConsoleConfig, activityBusy: () => boolean = () => false) {
    this.config = config;
    this.activityBusy = activityBusy;
    this.api = new DevApi(config);
    this.history = new HistoryFile(config.dataDir);
  }

  isBusy(): boolean {
    return this.run !== null && this.run.state !== "ended";
  }

  start(launch: Launch): void {
    if (this.isBusy()) throw new Error("Un lancement est déjà en cours.");
    if (this.activityBusy()) {
      throw new Error("Un lancement est en cours sur la page Activité simulée.");
    }
    const id = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
    const run: RunView = {
      id,
      launch,
      summary: summaryOf(launch),
      startedAt: new Date().toISOString(),
      endedAt: null,
      state: "running",
      progress: null,
      outcome: null,
      detail: null,
      lastLines: [],
    };
    const process = new ManagedProcess((line) => readLine(run, line));
    process.start(
      "pnpm",
      pnpmArgsOf(launch, this.config, reportFileOf(this.config, id)),
      this.config.repoRoot,
    );
    this.run = run;
    this.process = process;
    this.series = [];
    void process.wait().then(() => this.finish(run, process));
  }

  private async finish(run: RunView, process: ManagedProcess): Promise<void> {
    const report =
      run.launch.kind === "load"
        ? await readFile(reportFileOf(this.config, run.id), "utf8").catch(() => "")
        : "";
    const ended = outcomeOf(
      process.status().exitCode,
      run.state === "stopping",
      failedCriteria(report),
    );
    Object.assign(run, { ...ended, state: "ended", endedAt: new Date().toISOString() });
    run.lastLines = process.logs
      .all()
      .filter((line) => !line.startsWith("{"))
      .slice(-30);
    await this.history.add({
      id: run.id,
      kind: run.launch.kind,
      summary: run.summary,
      startedAt: run.startedAt,
      endedAt: run.endedAt ?? run.startedAt,
      outcome: ended.outcome,
      detail: ended.detail,
    });
  }

  /** Simulated flights in the air are closed as interrupted by pnpm simulate itself. */
  async stop(): Promise<void> {
    if (!this.run || this.run.state !== "running" || !this.process) return;
    this.run.state = "stopping";
    await this.process.stop(STOP_GRACE_MS);
  }

  async view(): Promise<TrafficView> {
    const [metrics, counts, history] = await Promise.all([
      this.run?.state === "ended" ? null : this.api.metrics(),
      this.api.counts(),
      this.history.read(),
    ]);
    if (metrics && this.run && this.run.state !== "ended") {
      this.series = [
        ...this.series,
        {
          at: new Date().toISOString(),
          flights: metrics.live.flights,
          viewers: metrics.live.viewers,
          loopP99Ms: metrics.eventLoopDelayMs.p99,
          rssMb: metrics.memoryMb.rss,
        },
      ].slice(-SERIES_SIZE);
    }
    return { run: this.run, series: this.series, counts, history };
  }

  async deleteSimulated(): Promise<void> {
    if (this.run && this.run.state !== "ended") {
      throw new Error("Arrêtez d'abord le lancement en cours.");
    }
    return this.api.deleteSimulated();
  }
}
