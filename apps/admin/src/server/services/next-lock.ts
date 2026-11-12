import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type PortOwner, processOwner } from "./port-owner.ts";

/**
 * Lock of `next dev` in apps/web (Next.js 16): one dev server per folder. A previous launch still
 * alive keeps it, even when it no longer listens on its port, and a new one exits with status 1.
 */
const SITE_NEXT_LOCK = join("apps", "web", ".next", "dev", "lock");

/** The pid written in the lock ({"pid":…,"port":…}); null if no lock or unreadable. */
export function lockPid(content: string): number | null {
  try {
    const pid: unknown = JSON.parse(content).pid;
    return typeof pid === "number" && Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

/** A Next.js process (« next-server (v16.4.6) », « node …/next dev »), not a reused pid. */
export const isNextProcess = (command: string) => /\bnext(-server)?\b/.test(command);

/**
 * The previous `next dev` still holding the lock; null if none (the file stays after a crash).
 * The lock is in this repository: a living Next.js process named in it is a Weems launch.
 */
export async function nextLockOwner(repoRoot: string): Promise<PortOwner | null> {
  let content: string;
  try {
    content = await readFile(join(repoRoot, SITE_NEXT_LOCK), "utf8");
  } catch {
    return null;
  }
  const pid = lockPid(content);
  const owner = pid === null ? null : await processOwner(pid, repoRoot);
  if (!owner) return null;
  return { ...owner, weems: owner.weems || isNextProcess(owner.name) };
}
