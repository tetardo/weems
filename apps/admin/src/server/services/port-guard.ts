import { execFile } from "node:child_process";
import { promisify } from "node:util";
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

/** The holder of a port the service needs while it does not answer; null if the port is free. */
export async function portHolder(port: number, repoRoot: string): Promise<PortHolder | null> {
  if (!(await probePort(port)).ok) return null;
  return holderOf(port, await portOwner(port, repoRoot));
}

/** Stops an old Weems program holding the port: docker stop, or SIGTERM then SIGKILL after 5 s. */
export async function releasePort(port: number, repoRoot: string): Promise<void> {
  const owner = await portOwner(port, repoRoot);
  if (!owner) return;
  if (!owner.weems) throw new Error(holderOf(port, owner).message);
  if (owner.kind === "docker") {
    await run("docker", ["stop", owner.name], { timeout: 60_000 });
    return;
  }
  if (owner.pid === null) return;
  process.kill(owner.pid, "SIGTERM");
  for (let i = 0; i < 10 && (await probePort(port)).ok; i++) await wait(500);
  if ((await probePort(port)).ok) process.kill(owner.pid, "SIGKILL");
}
