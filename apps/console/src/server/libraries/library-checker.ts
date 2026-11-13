import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { ConsoleConfig } from "../console-config.ts";
import { parseAudit } from "./audit.ts";
import { buildReport } from "./build-report.ts";
import { mapLimited, registryInfo } from "./registry.ts";
import { type LibrariesView, type LibraryReport, libraryReportSchema } from "./report.ts";
import { packageCount, parsePnpmList } from "./workspace.ts";

const run = promisify(execFile);
const REGISTRY_CALLS_AT_ONCE = 4;

/** Output of a pnpm command; `pnpm audit` exits with 1 when it finds something, still valid. */
async function pnpm(repoRoot: string, args: string[]): Promise<string> {
  const options = { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024, timeout: 120_000 };
  try {
    return (await run("pnpm", args, options)).stdout;
  } catch (error) {
    const stdout = (error as { stdout?: unknown }).stdout;
    if (typeof stdout === "string" && stdout.trim().startsWith("{")) return stdout;
    throw error;
  }
}

/**
 * Page Librairies: reads what is installed (pnpm ls), what npm has (registry) and the security
 * advisories (pnpm audit). Read-only: it never installs nor changes a file of the repository.
 * The last report is kept in apps/console/.data so the page opens at once after a restart.
 */
export class LibraryChecker {
  private report: LibraryReport | null = null;
  private checking: Promise<void> | null = null;
  private error: string | null = null;
  private readonly config: ConsoleConfig;
  private readonly cachePath: string;
  private readonly loaded: Promise<void>;

  constructor(config: ConsoleConfig) {
    this.config = config;
    this.cachePath = join(config.dataDir, "libraries.json");
    this.loaded = this.readCache();
  }

  /** The page's state; the first opening without any report starts a check. */
  async view(): Promise<LibrariesView> {
    await this.loaded;
    if (!this.report && !this.checking && !this.error) this.start();
    return { report: this.report, checking: this.checking !== null, error: this.error };
  }

  /** « Vérifier maintenant »: one check at a time, the page follows it by reading view(). */
  start(): void {
    this.checking ??= this.check().finally(() => {
      this.checking = null;
    });
  }

  private async check(): Promise<void> {
    try {
      this.report = await this.collect();
      this.error = null;
      await mkdir(this.config.dataDir, { recursive: true });
      await writeFile(this.cachePath, JSON.stringify(this.report, null, 2));
    } catch (error) {
      this.error = `Vérification impossible : ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  private async collect(): Promise<LibraryReport> {
    const { repoRoot } = this.config;
    const [list, audit] = await Promise.all([
      pnpm(repoRoot, ["ls", "-r", "--depth", "0", "--json"]),
      pnpm(repoRoot, ["audit", "--json"]).then(parseAudit, (error: unknown) => error),
    ]);
    const libraries = parsePnpmList(list, repoRoot);
    const registry = await mapLimited(libraries, REGISTRY_CALLS_AT_ONCE, (library) =>
      registryInfo(library.name),
    );
    const auditFailed = !Array.isArray(audit);
    return buildReport(
      {
        libraries,
        registry,
        alerts: auditFailed ? [] : audit,
        packages: packageCount(list),
        auditError: auditFailed ? `pnpm audit : ${String(audit)}` : null,
      },
      new Date(),
    );
  }

  /** A missing or outdated cache file is no report: the page checks again. */
  private async readCache(): Promise<void> {
    try {
      const text = await readFile(this.cachePath, "utf8");
      this.report = libraryReportSchema.parse(JSON.parse(text));
    } catch {
      this.report = null;
    }
  }
}
