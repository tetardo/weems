import { type ChildProcess, spawn } from "node:child_process";
import { LogBuffer } from "./log-buffer.ts";

/**
 * Environment of a started command: the console's own, minus what Next.js set for the console
 * itself (PORT=3002 would move the API onto the console's port).
 */
export function childEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const clean: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key === "PORT" || key === "NODE_ENV" || key.startsWith("__NEXT") || key === "NEXT_RUNTIME")
      continue;
    clean[key] = value;
  }
  return clean as NodeJS.ProcessEnv;
}

export interface ProcessStatus {
  running: boolean;
  pid: number | null;
  startedAt: string | null;
  /** Exit code of the last run; null while running or never run. */
  exitCode: number | null;
}

/**
 * A command started by the console (pnpm dev, pnpm simulate…), in its own process group so that
 * stopping it also stops what pnpm started under it.
 */
export class ManagedProcess {
  readonly logs = new LogBuffer();
  private child: ChildProcess | null = null;
  private startedAt: Date | null = null;
  private exitCode: number | null = null;
  private exited: Promise<void> = Promise.resolve();
  private readonly onLine: ((line: string) => void) | undefined;

  constructor(onLine?: (line: string) => void) {
    this.onLine = onLine;
  }

  status(): ProcessStatus {
    return {
      running: this.child !== null,
      pid: this.child?.pid ?? null,
      startedAt: this.startedAt?.toISOString() ?? null,
      exitCode: this.exitCode,
    };
  }

  start(command: string, args: readonly string[], cwd: string): void {
    if (this.child) throw new Error("Already running.");
    const child = spawn(command, args, { cwd, detached: true, env: childEnv(process.env) });
    this.child = child;
    this.startedAt = new Date();
    this.exitCode = null;
    const read = (chunk: Buffer) =>
      this.logs.write(chunk.toString()).forEach((l) => this.onLine?.(l));
    child.stdout?.on("data", read);
    child.stderr?.on("data", read);
    this.exited = new Promise((resolve) => {
      // "close", not "exit": pnpm may end before the program it started, which still writes.
      child.once("close", (code, signal) => {
        this.exitCode = code ?? (signal ? 143 : 1);
        this.child = null;
        resolve();
      });
      child.once("error", (error) => {
        this.logs.push(`[console] ${error.message}`);
        this.exitCode = 127;
        this.child = null;
        resolve();
      });
    });
  }

  /** SIGTERM to the whole group, then SIGKILL after `graceMs` if it is still there. */
  async stop(graceMs = 10_000): Promise<void> {
    const pid = this.child?.pid;
    if (!pid) return;
    signalGroup(pid, "SIGTERM");
    const killer = setTimeout(() => signalGroup(pid, "SIGKILL"), graceMs);
    await this.exited;
    clearTimeout(killer);
  }

  /** Resolves when the current run ends. */
  wait(): Promise<void> {
    return this.exited;
  }
}

function signalGroup(pid: number, signal: NodeJS.Signals): void {
  try {
    process.kill(-pid, signal);
  } catch {
    // Already gone.
  }
}
