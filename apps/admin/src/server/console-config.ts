import { resolve } from "node:path";

/** Where the console finds the rest of Weems on the Mac. Read once; every value has a default. */
export interface ConsoleConfig {
  /** Root of the monorepo: commands run there (`pnpm dev` is started from apps/admin). */
  repoRoot: string;
  apiUrl: string;
  siteUrl: string;
  /** Address of this console: the origin of its logins to the API (allowed outside production). */
  adminUrl: string;
  /** Fixed development token of the API (`pnpm simulate`, `pnpm load`). */
  devToken: string;
  /** Local files of the console (history of runs), never committed. */
  dataDir: string;
}

export function consoleConfig(
  source: Record<string, string | undefined> = process.env,
): ConsoleConfig {
  const repoRoot = source["WEEMS_REPO_ROOT"] ?? resolve(process.cwd(), "../..");
  return {
    repoRoot,
    apiUrl: source["WEEMS_API_URL"] ?? "http://localhost:3000",
    siteUrl: source["WEEMS_SITE_URL"] ?? "http://localhost:3001",
    adminUrl: source["WEEMS_ADMIN_URL"] ?? "http://127.0.0.1:3002",
    devToken: source["WEEMS_DEV_TOKEN"] ?? "dev-token",
    dataDir: resolve(repoRoot, "apps/admin/.data"),
  };
}
