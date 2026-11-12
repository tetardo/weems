import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { nextLockOwner } from "./next-lock.ts";
import { type PortOwner, portOwner } from "./port-owner.ts";
import { probePort } from "./probes.ts";
import type { PortHolder } from "./service-view.ts";

const run = promisify(execFile);
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Command lines can be long (node … next dev …): shown shortened on the card. */
const MAX_NAME = 80;

const shorten = (text: string) => (text.length > MAX_NAME ? `${text.slice(0, MAX_NAME)}…` : text);

/** What the card says about the program holding the port (choice of Greg, 11/11/2026). */
export function holderOf(port: number, owner: PortOwner | null): PortHolder {
  if (!owner) {
    return {
      message: `Port ${port} déjà pris par un programme que la console ne voit pas (lsof -i :${port} pour le trouver).`,
      owner: null,
      freeable: false,
    };
  }
  const what =
    owner.kind === "docker"
      ? `le conteneur Docker « ${owner.name} »`
      : `le processus ${owner.pid} (${shorten(owner.name)})`;
  return owner.weems
    ? {
        message: `Port ${port} tenu par un lancement de Weems qui ne répond pas encore : ${what}. S'il reste bloqué, libérez le port.`,
        owner: what,
        freeable: true,
      }
    : {
        message: `Port ${port} déjà pris par ${what}, qui n'est pas à Weems : la console n'y touche pas.`,
        owner: what,
        freeable: false,
      };
}

/** A previous `next dev` of the site, alive but holding its lock: a new one exits with status 1. */
export function lockHolderOf(owner: PortOwner): PortHolder {
  const what = `le processus ${owner.pid} (${shorten(owner.name)})`;
  return owner.weems
    ? {
        message: `Un ancien lancement du site tourne encore et bloque le démarrage : ${what}. Libérez-le.`,
        owner: what,
        freeable: true,
      }
    : {
        message: `Le verrou de Next.js est tenu par ${what}, qui n'est pas à Weems : la console n'y touche pas.`,
        owner: what,
        freeable: false,
      };
}

/** What blocks a service that does not answer: its port, or for the site the lock of next dev. */
async function blocker(
  port: number,
  repoRoot: string,
  nextLock: boolean,
): Promise<{ owner: PortOwner | null; holder: PortHolder } | null> {
  if ((await probePort(port)).ok) {
    const owner = await portOwner(port, repoRoot);
    return { owner, holder: holderOf(port, owner) };
  }
  const owner = nextLock ? await nextLockOwner(repoRoot) : null;
  return owner ? { owner, holder: lockHolderOf(owner) } : null;
}

/** The holder blocking the service while it does not answer; null if nothing blocks it. */
export async function portHolder(
  port: number,
  repoRoot: string,
  nextLock = false,
): Promise<PortHolder | null> {
  return (await blocker(port, repoRoot, nextLock))?.holder ?? null;
}

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

/** Stops an old Weems program blocking the service: docker stop, or SIGTERM then SIGKILL after 5 s. */
export async function releasePort(port: number, repoRoot: string, nextLock = false): Promise<void> {
  const found = await blocker(port, repoRoot, nextLock);
  if (!found?.owner) return;
  const { owner, holder } = found;
  if (!owner.weems) throw new Error(holder.message);
  if (owner.kind === "docker") {
    await run("docker", ["stop", owner.name], { timeout: 60_000 });
    return;
  }
  if (owner.pid === null) return;
  const pid = owner.pid;
  process.kill(pid, "SIGTERM");
  for (let i = 0; i < 10 && alive(pid); i++) await wait(500);
  if (alive(pid)) process.kill(pid, "SIGKILL");
}
