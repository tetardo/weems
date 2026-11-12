import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { childEnv } from "../managed-process.ts";

const run = promisify(execFile);

/**
 * « Appliquer les migrations »: the API's own command (`pnpm --filter @weems/api db:migrate`),
 * as Greg types it by hand; the console writes nothing itself. Returns its last lines.
 */
export async function applyMigrations(repoRoot: string): Promise<string> {
  try {
    const { stdout, stderr } = await run("pnpm", ["--filter", "@weems/api", "db:migrate"], {
      cwd: repoRoot,
      env: childEnv(process.env),
      timeout: 120_000,
    });
    return lastLines(`${stdout}${stderr}`);
  } catch (error) {
    const output = `${(error as { stdout?: string }).stdout ?? ""}${(error as { stderr?: string }).stderr ?? ""}`;
    throw new Error(`Migrations non appliquées : ${lastLines(output) || String(error)}`, {
      cause: error,
    });
  }
}

const lastLines = (text: string) => text.trim().split("\n").slice(-5).join("\n");
