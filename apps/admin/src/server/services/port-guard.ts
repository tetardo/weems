import { containerPublishing } from "./docker.ts";
import { probePort } from "./probes.ts";

/** What the page says when a port the console needs is already taken by another program. */
export function busyPortMessage(port: number, container: string | null): string {
  if (container) {
    return `Port ${port} déjà pris par le conteneur Docker « ${container} » : arrêtez-le (docker stop ${container}) puis redémarrez.`;
  }
  return `Port ${port} déjà pris par un autre programme (lsof -i :${port} pour le trouver) : arrêtez-le puis redémarrez.`;
}

/**
 * Called before starting a pnpm dev: the service did not answer its health check, so a port
 * that is open belongs to someone else (often an old Docker container, invisible to lsof).
 */
export async function assertPortFree(port: number): Promise<void> {
  if (!(await probePort(port)).ok) return;
  throw new Error(busyPortMessage(port, await containerPublishing(port)));
}
