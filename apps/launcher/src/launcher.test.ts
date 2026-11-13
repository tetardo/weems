import type { LifecycleRequest, LifecycleStatus } from "@weems/contrats";
import type { ProcessStatus } from "@weems/local-process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type LaunchedProcess, Launcher } from "./launcher.ts";
import { repoPaths } from "./repo.ts";

const ANSWER: LifecycleStatus = { services: [], dockerAvailable: true, logs: null };

/** A started command: records what ran, ends at once with `exitCode` (scripts) or runs (console). */
class FakeProcess implements LaunchedProcess {
  ran: string[] = [];
  private current: ProcessStatus = { running: false, pid: null, startedAt: null, exitCode: null };
  private readonly world: World;
  private readonly onLine: (line: string) => void;
  constructor(world: World, onLine: (line: string) => void) {
    this.world = world;
    this.onLine = onLine;
  }
  start(_command: string, args: readonly string[]): void {
    const script = String(args[0]).split("/").at(-1) ?? "";
    this.world.ran.push(script);
    const long = script === "console.sh";
    if (long) this.world.consoleUp = true;
    if (script === "stop.sh") this.world.consoleUp = false;
    const exitCode = long ? null : (this.world.exitCodes[script] ?? 0);
    this.current = { running: long, pid: long ? 4242 : null, startedAt: null, exitCode };
    this.onLine(`ran ${script}`);
  }
  async stop(): Promise<void> {
    this.current = { ...this.current, running: false, exitCode: 143 };
  }
  async wait(): Promise<void> {}
  status(): ProcessStatus {
    return this.current;
  }
}

class World {
  ran: string[] = [];
  sent: LifecycleRequest[] = [];
  consoleUp = false;
  exitCodes: Record<string, number> = {};
  refuse: string | null = null;
  root = mkdtempSync(join(tmpdir(), "launcher-"));

  launcher(): Launcher {
    return new Launcher({
      client: {
        status: async () => (this.consoleUp ? ANSWER : null),
        send: async (request) => {
          if (this.refuse) throw new Error(this.refuse);
          this.sent.push(request);
        },
      },
      siteStats: async () => (this.consoleUp ? { pilots: 12, flights: 340, liveFlights: 3 } : null),
      paths: repoPaths(this.root),
      newProcess: (onLine) => new FakeProcess(this, onLine),
      sleep: async () => undefined,
    });
  }
}

describe("Launcher", () => {
  it("prepares, starts the console, then asks it to start everything", async () => {
    const world = new World();
    const launcher = world.launcher();
    await launcher.command({ type: "start-all" });
    expect(world.ran).toEqual(["prepare.sh", "console.sh"]);
    expect(world.sent).toEqual([{ action: "start-all" }]);
    const consolePid = join(world.root, "apps", "admin", ".data", "console.pid");
    expect(readFileSync(consolePid, "utf8")).toBe("4242");
    const state = launcher.state();
    expect(state.busy).toBeNull();
    expect(state.rows.at(-1)?.state).toBe("running");
    expect(state.logs).toContain("ran console.sh");
    expect(state.stats).toEqual({ pilots: 12, flights: 340, liveFlights: 3 });
  });

  it("reuses a console that already answers", async () => {
    const world = new World();
    world.consoleUp = true;
    await world.launcher().command({ type: "start-all" });
    expect(world.ran).toEqual([]);
    expect(world.sent).toEqual([{ action: "start-all" }]);
  });

  it("stops nothing more when the preparation fails, and says why", async () => {
    const world = new World();
    world.exitCodes["prepare.sh"] = 1;
    const launcher = world.launcher();
    await launcher.command({ type: "start-all" });
    expect(world.ran).toEqual(["prepare.sh"]);
    expect(launcher.state().notice).toBe(
      "prepare.sh s'est arrêté (code 1) : voir l'onglet Console.",
    );
  });

  it("restarts one service through the console, and shows its refusal", async () => {
    const world = new World();
    world.consoleUp = true;
    const launcher = world.launcher();
    await launcher.command({ type: "service", action: "restart", id: "api" });
    expect(world.sent).toEqual([{ action: "restart", service: "api" }]);
    world.refuse = "Lancé hors de la console : arrêtez-le dans son terminal.";
    await launcher.command({ type: "service", action: "stop", id: "site" });
    expect(launcher.state().notice).toBe(world.refuse);
  });

  it("stops everything with stop.sh, also from the console's own buttons", async () => {
    const world = new World();
    const launcher = world.launcher();
    await launcher.command({ type: "start-all" });
    await launcher.command({ type: "service", action: "stop", id: "console" });
    expect(world.ran).toEqual(["prepare.sh", "console.sh", "stop.sh"]);
    expect(launcher.state().rows.at(-1)?.state).toBe("stopped");
  });

  it("restarts everything: stop, then the whole start", async () => {
    const world = new World();
    const launcher = world.launcher();
    await launcher.command({ type: "start-all" });
    await launcher.command({ type: "restart-all" });
    expect(world.ran).toEqual(["prepare.sh", "console.sh", "stop.sh", "prepare.sh", "console.sh"]);
  });

  it("shows the logs of the tab chosen", async () => {
    const world = new World();
    const launcher = world.launcher();
    await launcher.command({ type: "tab", tab: "api" });
    expect(launcher.state()).toMatchObject({ tab: "api", logs: [] });
  });
});
