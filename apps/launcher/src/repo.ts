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
  api: "http://localhost:3000",
  console: "http://127.0.0.1:3002",
  site: "http://localhost:3001/fr",
} as const;

/** Pages of the console opened by the window's links. */
const CONSOLE_PAGES = { console: "services", traffic: "traffic", activity: "activity" } as const;

/** Docker Desktop, where the database runs (button « Ouvrir Docker »). */
export const DOCKER_APP = "/Applications/Docker.app";

/** VS Code, opened on the repository (button « VS Code »). */
export const VSCODE_APP = "Visual Studio Code";

export function linkUrl(target: Exclude<LinkTarget, "docker" | "vscode">): string {
  if (target === "site") return URLS.site;
  return `${URLS.console}/${CONSOLE_PAGES[target]}`;
}
