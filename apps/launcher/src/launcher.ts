import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { LifecycleRequest, LifecycleStatus } from "@weems/contrats";
import { LogBuffer, type ProcessStatus } from "@weems/local-process";
import type {
  LauncherCommand,
  LauncherState,
  RowId,
  ServiceAction,
  SiteNumbers,
} from "./launcher-state.ts";
import type { RepoPaths } from "./repo.ts";
import { rowsOf } from "./rows.ts";

/** What the launcher needs from a started command: ManagedProcess of @weems/local-process. */
export interface LaunchedProcess {
  start(command: string, args: readonly string[], cwd: string): void;
  stop(): Promise<void>;
  wait(): Promise<void>;
  status(): ProcessStatus;
}

export interface LauncherDeps {
  client: {
    status(logsOf: "db" | "api" | "site" | null): Promise<LifecycleStatus | null>;
    send(request: LifecycleRequest): Promise<void>;
  };
  /** The site's counters (API); null when the API does not answer. */
  siteStats(): Promise<SiteNumbers | null>;
  paths: RepoPaths;
  newProcess(onLine: (line: string) => void): LaunchedProcess;
  sleep(ms: number): Promise<void>;
}

/** The console has this long to answer after its start (first compilation of Next.js). */
const CONSOLE_WAIT_S = 120;
const LABELS: Record<ServiceAction, string> = {
  start: "Démarrage",
  stop: "Arrêt",
  restart: "Redémarrage",
};
const NAMES = { db: "de la base", api: "de l'API", site: "du site" } as const;

/**
 * Starts, stops and restarts Weems on the Mac without Terminal (fiche 020). The launcher runs
 * scripts/mac/prepare.sh and the console itself; the console runs the database, the API and the
 * site (route /api/lifecycle), as for the icons of fiche 011.
 */
export class Launcher {
  private readonly deps: LauncherDeps;
  /** The tab Console: the scripts' lines and the console's own. */
  private readonly logs = new LogBuffer(400);
  private readonly console: LaunchedProcess;
  private status: LifecycleStatus | null = null;
  private stats: SiteNumbers | null = null;
  private busy: string | null = null;
  private notice: string | null = null;
  private tab: RowId = "console";
  /** A stop was asked: the end of the console is no error then, until its next start. */
  private stopAsked = false;
  private refreshing = false;
  private readonly listeners: ((state: LauncherState) => void)[] = [];

  constructor(deps: LauncherDeps) {
    this.deps = deps;
    this.console = deps.newProcess((line) => this.logs.push(line));
  }

  onChange(listener: (state: LauncherState) => void): void {
    this.listeners.push(listener);
  }

  state(): LauncherState {
    const facts = {
      answers: this.status !== null,
      process: this.console.status(),
      stopAsked: this.stopAsked,
    };
    const logs = this.tab === "console" ? this.logs.all() : (this.status?.logs ?? []);
    const { busy, notice, tab, stats } = this;
    return { rows: rowsOf(this.status, facts), stats, busy, notice, tab, logs };
  }

  /** Reads the console again (every 2 s, and after each action). */
  async refresh(): Promise<void> {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      [this.status, this.stats] = await Promise.all([
        this.deps.client.status(this.tab === "console" ? null : this.tab),
        this.deps.siteStats(),
      ]);
    } finally {
      this.refreshing = false;
    }
    this.emit();
  }

  /** Every command of the window and the menu bar, except the links (opened by main.ts). */
  command(command: Exclude<LauncherCommand, { type: "open" }>): Promise<void> {
    switch (command.type) {
      case "start-all":
        return this.run("Démarrage de Weems…", () => this.bootAll());
      case "stop-all":
        return this.run("Arrêt de Weems…", () => this.shutdownAll());
      case "restart-all":
        return this.run("Redémarrage de Weems…", () => this.rebootAll());
      case "service":
        return this.service(command.action, command.id);
      case "tab":
        this.tab = command.tab;
        this.emit();
        return this.refresh();
    }
  }

  /** Quitting the app: everything stops, even during another action. */
  async quit(): Promise<void> {
    this.busy = "Arrêt de Weems…";
    this.emit();
    await this.shutdownAll().catch((error: unknown) => this.logs.push(`! ${messageOf(error)}`));
  }

  /** The API and the site depend on the console: its buttons act on everything. */
  private service(action: ServiceAction, id: RowId): Promise<void> {
    if (id === "console") {
      return this.command({ type: action === "start" ? "start-all" : `${action}-all` });
    }
    const label = `${LABELS[action]} ${NAMES[id]}…`;
    return this.run(label, () => this.deps.client.send({ action, service: id }));
  }

  private async run(label: string, work: () => Promise<void>): Promise<void> {
    if (this.busy) return;
    this.busy = label;
    this.notice = null;
    this.emit();
    try {
      await work();
    } catch (error) {
      this.notice = messageOf(error);
    } finally {
      this.busy = null;
      await this.refresh();
    }
  }

  private async bootAll(): Promise<void> {
    if (!(await this.deps.client.status(null))) {
      await this.runScript("prepare");
      this.startConsole();
      await this.waitForConsole();
    }
    await this.deps.client.send({ action: "start-all" });
  }

  /** stop.sh asks the console to stop everything, then stops it (console.pid) and the database. */
  private async shutdownAll(): Promise<void> {
    this.stopAsked = true;
    await this.runScript("stop");
    await this.console.stop();
  }

  private async rebootAll(): Promise<void> {
    await this.shutdownAll();
    await this.bootAll();
  }

  private async runScript(name: "prepare" | "stop"): Promise<void> {
    const script = this.deps.newProcess((line) => {
      this.logs.push(line);
      this.emit();
    });
    this.logs.push(`› scripts/mac/${name}.sh`);
    script.start("/bin/bash", [this.deps.paths.script(name)], this.deps.paths.root);
    await script.wait();
    const code = script.status().exitCode;
    if (code !== 0)
      throw new Error(`${name}.sh s'est arrêté (code ${code}) : voir l'onglet Console.`);
  }

  private startConsole(): void {
    if (this.console.status().running) return;
    this.stopAsked = false;
    this.logs.push("› scripts/mac/console.sh (pnpm admin)");
    this.console.start("/bin/bash", [this.deps.paths.script("console")], this.deps.paths.root);
    const { pid } = this.console.status();
    if (pid === null) return;
    // Its own process group (detached): stop.sh stops it, with what pnpm started, by this pid.
    mkdirSync(dirname(this.deps.paths.consolePidFile), { recursive: true });
    writeFileSync(this.deps.paths.consolePidFile, String(pid));
  }

  private async waitForConsole(): Promise<void> {
    for (let second = 0; second < CONSOLE_WAIT_S; second++) {
      this.status = await this.deps.client.status(null);
      this.emit();
      if (this.status) return;
      if (!this.console.status().running) {
        throw new Error("La console s'est arrêtée au démarrage : voir l'onglet Console.");
      }
      await this.deps.sleep(1_000);
    }
    throw new Error("La console ne répond pas après 2 minutes : voir l'onglet Console.");
  }

  private emit(): void {
    const state = this.state();
    for (const listener of this.listeners) listener(state);
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
