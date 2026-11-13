import type { LinkTarget } from "./launcher-state.ts";
import { join } from "node:path";

/** Where the launcher finds Weems on the Mac: the repository it was built from. */
export interface RepoPaths {
  root: string;
  /** scripts/mac/<name>.sh */
  script(name: "prepare" | "console" | "stop"): string;
  /** apps/admin/.data/console.pid: read by stop.sh to stop the console's process group. */
  consolePidFile: string;
}

export function repoPaths(root: string): RepoPaths {
  return {
    root,
    script: (name) => join(root, "scripts", "mac", `${name}.sh`),
    consolePidFile: join(root, "apps", "admin", ".data", "console.pid"),
  };
}

/** Addresses opened by the window's links, and the console the launcher talks to. */
export const URLS = {
  console: "http://127.0.0.1:3002",
  site: "http://localhost:3001/fr",
} as const;

/** Docker Desktop, where the database runs (icon of the top bar). */
export const DOCKER_APP = "/Applications/Docker.app";

/** VS Code, opened on the repository (icon of the top bar). */
export const VSCODE_APP = "Visual Studio Code";

/**
 * Claude desktop (icon of the top bar). macOS opens the app only: it has no documented way to be
 * opened on a folder, the project is picked inside it.
 */
export const CLAUDE_APP = "Claude";

export function linkUrl(target: Exclude<LinkTarget, "docker" | "vscode" | "claude">): string {
  if (target === "site") return URLS.site;
  return `${URLS.console}/services`;
}
