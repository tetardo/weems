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

export function linkUrl(target: "site" | "console" | "traffic"): string {
  if (target === "site") return URLS.site;
  return `${URLS.console}/${target === "console" ? "services" : "traffic"}`;
}
