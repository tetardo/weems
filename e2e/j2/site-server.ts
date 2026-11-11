import { type ChildProcess, spawn } from "node:child_process";
import { join } from "node:path";

const WEB_DIR = join(import.meta.dirname, "..", "..", "apps", "web");
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The built site (`next build` done beforehand by `pnpm test:j2`), in production mode,
 * talking to the API at `apiUrl`.
 */
export async function startSite(
  port: number,
  apiUrl: string,
): Promise<{ url: string; stop: () => void }> {
  const child: ChildProcess = spawn(
    join(WEB_DIR, "node_modules", ".bin", "next"),
    ["start", "--port", String(port)],
    { cwd: WEB_DIR, env: { ...process.env, WEEMS_API_URL: apiUrl }, stdio: "ignore" },
  );
  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${url}/fr`)).ok) return { url, stop: () => child.kill() };
    } catch {
      // not listening yet
    }
    await wait(200);
  }
  child.kill();
  throw new Error("The site did not start: was `pnpm --filter @weems/web build` run?");
}
