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

interface Listener {
  pid: number;
  command: string;
  cwd: string;
}

/** Process listening on the port (lsof), with its command line (ps); null if none or no lsof. */
async function listeningProcess(port: number): Promise<Listener | null> {
  try {
    const { stdout } = await run("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
      timeout: 5_000,
    });
    const pid = Number(stdout.trim().split("\n")[0]);
    if (!Number.isInteger(pid) || pid <= 0) return null;
    const ps = await run("ps", ["-o", "command=", "-p", String(pid)], { timeout: 5_000 });
    return { pid, command: ps.stdout.trim(), cwd: await cwdOf(pid) };
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
  const process = await listeningProcess(port);
  if (!process) return null;
  return {
    kind: "process",
    name: process.command,
    pid: process.pid,
    weems: isWeemsProcess(process.command, process.cwd, repoRoot),
  };
}
