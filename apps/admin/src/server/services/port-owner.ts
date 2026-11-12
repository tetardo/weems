import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { containerPublishing } from "./docker.ts";

const run = promisify(execFile);

/** Who listens on a port the console needs: a Docker container, or a process of this Mac. */
export interface PortOwner {
  kind: "docker" | "process";
  /** Container name, or the process's command line. */
  name: string;
  pid: number | null;
  /** Started from this repository (old pnpm dev) or a container of the weems project. */
  weems: boolean;
}

/** A container of apps/api/docker-compose.yml (project « weems »): weems-db-1, weems-api-1. */
export const isWeemsContainer = (name: string) => /^weems[-_]/.test(name);

/**
 * A process launched from this repository: its command line or its working folder is in the
 * repository (Next.js renames its server « next-server », but it runs in apps/web).
 */
export const isWeemsProcess = (command: string, cwd: string, repoRoot: string) =>
  command.includes(repoRoot) || cwd === repoRoot || cwd.startsWith(`${repoRoot}/`);

/** Working folder of a process (lsof prints it on a line starting with « n »). */
async function cwdOf(pid: number): Promise<string> {
  try {
    const { stdout } = await run("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], {
      timeout: 5_000,
    });
    return (
      stdout
        .split("\n")
        .find((line) => line.startsWith("n"))
        ?.slice(1) ?? ""
    );
  } catch {
    return "";
  }
}

/** A process of this Mac, with its command line (ps) and working folder; null if it is gone. */
export async function processOwner(pid: number, repoRoot: string): Promise<PortOwner | null> {
  try {
    const ps = await run("ps", ["-o", "command=", "-p", String(pid)], { timeout: 5_000 });
    const command = ps.stdout.trim();
    if (!command) return null;
    const weems = isWeemsProcess(command, await cwdOf(pid), repoRoot);
    return { kind: "process", name: command, pid, weems };
  } catch {
    return null;
  }
}

/** Process listening on the port (lsof); null if none or no lsof. */
async function listeningPid(port: number): Promise<number | null> {
  try {
    const { stdout } = await run("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
      timeout: 5_000,
    });
    const pid = Number(stdout.trim().split("\n")[0]);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

/** Docker first: a published port is held by Docker Desktop, which lsof shows as « com.docker ». */
export async function portOwner(port: number, repoRoot: string): Promise<PortOwner | null> {
  const container = await containerPublishing(port);
  if (container) {
    return { kind: "docker", name: container, pid: null, weems: isWeemsContainer(container) };
  }
  const pid = await listeningPid(port);
  return pid === null ? null : processOwner(pid, repoRoot);
}
