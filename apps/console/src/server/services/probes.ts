import { createConnection } from "node:net";

export interface Probe {
  ok: boolean;
  /** What the page shows: "/v1/health 200", "port 5432 fermé"… */
  detail: string;
  ms: number | null;
}

const TIMEOUT_MS = 1500;

/** Is something listening on this local port (the database, outside or inside Docker)? */
export function probePort(port: number, host = "127.0.0.1"): Promise<Probe> {
  const started = Date.now();
  return new Promise((resolve) => {
    const socket = createConnection({ port, host, timeout: TIMEOUT_MS });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve({
        ok,
        detail: ok ? `port ${port} ouvert` : `port ${port} fermé`,
        ms: ok ? Date.now() - started : null,
      });
    };
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

/** An HTTP answer below 500 means the service is up (a login redirect is fine). */
export async function probeHttp(url: string): Promise<Probe> {
  const started = Date.now();
  const path = new URL(url).pathname;
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const ok = response.status < 500;
    return { ok, detail: `${path} ${response.status}`, ms: Date.now() - started };
  } catch {
    return { ok: false, detail: `${path} sans réponse`, ms: null };
  }
}
