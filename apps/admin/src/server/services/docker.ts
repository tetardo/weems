import { execFile } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Containers of apps/api/docker-compose.yml: the database, and the API in Docker mode. */
export type ComposeService = "db" | "api";

export interface ContainerState {
  name: string;
  running: boolean;
  /** "Up 2 hours (healthy)"… as Docker says it. */
  status: string;
}

export interface DockerState {
  /** Docker Desktop answers. */
  available: boolean;
  containers: Partial<Record<ComposeService, ContainerState>>;
}

interface ComposeRow {
  Service?: string;
  Name?: string;
  State?: string;
  Status?: string;
}

/** `docker compose ps --format json` prints one object per line (or an array on old versions). */
export function parseComposePs(output: string): DockerState["containers"] {
  const trimmed = output.trim();
  if (!trimmed) return {};
  const rows: ComposeRow[] = trimmed.startsWith("[")
    ? JSON.parse(trimmed)
    : trimmed.split("\n").map((line) => JSON.parse(line) as ComposeRow);
  const containers: DockerState["containers"] = {};
  for (const row of rows) {
    if (row.Service !== "db" && row.Service !== "api") continue;
    containers[row.Service] = {
      name: row.Name ?? row.Service,
      running: row.State === "running",
      status: row.Status ?? row.State ?? "",
    };
  }
  return containers;
}

export class DockerCompose {
  private readonly file: string;
  private readonly cwd: string;

  constructor(repoRoot: string) {
    this.cwd = join(repoRoot, "apps/api");
    this.file = join(this.cwd, "docker-compose.yml");
  }

  private compose(args: readonly string[], timeout = 120_000) {
    return run("docker", ["compose", "-f", this.file, ...args], { cwd: this.cwd, timeout });
  }

  async state(): Promise<DockerState> {
    try {
      const { stdout } = await this.compose(["ps", "--all", "--format", "json"], 5_000);
      return { available: true, containers: parseComposePs(stdout) };
    } catch {
      return { available: false, containers: {} };
    }
  }

  async up(service: ComposeService): Promise<void> {
    await this.compose(["up", "-d", service]);
  }

  async stop(service: ComposeService): Promise<void> {
    await this.compose(["stop", service]);
  }

  async logs(service: ComposeService): Promise<string[]> {
    try {
      const { stdout, stderr } = await this.compose(
        ["logs", "--no-color", "--tail", "200", service],
        5_000,
      );
      return `${stdout}${stderr}`.split("\n").filter(Boolean);
    } catch (error) {
      return [`[console] ${error instanceof Error ? error.message : String(error)}`];
    }
  }
}
