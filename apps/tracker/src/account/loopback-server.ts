import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

/** What the browser brought back to http://127.0.0.1:{port}{path}. */
interface LoopbackAnswer {
  code: string | null;
  state: string | null;
  error: string | null;
}

export interface Loopback {
  redirectUri: string;
  /** Resolves on the first request to the redirect path, rejects after `timeoutMs`. */
  answer: Promise<LoopbackAnswer>;
  close: () => void;
}

/** Page shown in the browser once the tracker has its answer (no data, no script). */
const DONE_PAGE =
  '<!doctype html><meta charset="utf-8"><title>Weems</title>' +
  '<p style="font:16px system-ui;margin:3rem;text-align:center">' +
  "Connexion terminée, vous pouvez revenir au tracker Weems.<br>" +
  "Login complete, you can go back to the Weems tracker.</p>";

/**
 * Local server that receives the browser after login (RFC 8252, section 7.3):
 * 127.0.0.1 only, a free port chosen by the system, closed after the first answer.
 */
export function startLoopback(path: string, timeoutMs: number): Promise<Loopback> {
  let settle: { resolve: (a: LoopbackAnswer) => void; reject: (e: Error) => void } | undefined;
  const answer = new Promise<LoopbackAnswer>((resolve, reject) => (settle = { resolve, reject }));
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== path) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", connection: "close" });
    response.end(DONE_PAGE);
    const query = url.searchParams;
    settle?.resolve({
      code: query.get("code"),
      state: query.get("state"),
      error: query.get("error"),
    });
  });
  const timer = setTimeout(() => settle?.reject(new Error("login timed out")), timeoutMs);
  const close = () => {
    clearTimeout(timer);
    server.close();
    server.closeAllConnections();
  };
  void answer.finally(close).catch(() => undefined);
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({ redirectUri: `http://127.0.0.1:${port}${path}`, answer, close });
    }),
  );
}
