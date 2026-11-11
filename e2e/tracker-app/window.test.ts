import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron, type ElectronApplication, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The real desktop tracker (J3), without the simulator nor the API. TRACKER_EXECUTABLE: the packaged
 * app (Windows CI); otherwise Electron runs apps/tracker/dist/app (built by `pnpm app`'s build step).
 */
const tracker = join(import.meta.dirname, "..", "..", "apps", "tracker");
const { version } = JSON.parse(readFileSync(join(tracker, "package.json"), "utf8")) as {
  version: string;
};

function launchOptions(dataDir: string) {
  const args = [`--user-data-dir=${dataDir}`, "--lang=fr"];
  if (process.platform === "linux") args.push("--no-sandbox");
  const env = { ...process.env, WEEMS_API_URL: "http://127.0.0.1:9" };
  const packaged = process.env["TRACKER_EXECUTABLE"];
  if (packaged) return { executablePath: packaged, args, env };
  const electron = createRequire(join(tracker, "package.json"))("electron") as string;
  return { executablePath: electron, args: [join(tracker, "dist", "app"), ...args], env };
}

let dataDir: string;
let app: ElectronApplication;
let page: Page;

beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "weems-tracker-app-"));
  app = await _electron.launch(launchOptions(dataDir));
  page = await app.firstWindow();
});
afterAll(async () => {
  await app?.close();
  rmSync(dataDir, { recursive: true, force: true });
});

describe("desktop tracker window", () => {
  it("shows its version, a logged-out pilot and no simulator", async () => {
    await expect.poll(() => page.textContent("#version")).toBe(version);
    await expect.poll(() => page.textContent("#account-status")).toMatch(/^Non connecté/);
    await expect.poll(() => page.textContent("#simulator-status")).toMatch(/^MSFS non détecté/);
    expect(await page.isVisible("#log-in")).toBe(true);
    expect(await page.isVisible("#close-flight")).toBe(false);
  });

  it("refuses a malformed callsign and keeps a valid next flight on the PC", async () => {
    await page.fill("[name=callsign]", "W");
    await page.click("#settings [type=submit]");
    await expect.poll(() => page.textContent("#notice")).not.toBe("");

    await page.fill("[name=callsign]", "wms42");
    await page.fill("[name=departureIcao]", "lfpg");
    await page.fill("[name=arrivalIcao]", "lfbo");
    await page.click("#settings [type=submit]");
    await expect.poll(() => page.textContent("#notice")).toBe("");
    const saved = JSON.parse(readFileSync(join(dataDir, "settings.json"), "utf8")) as unknown;
    expect(saved).toEqual({ callsign: "WMS42", departureIcao: "LFPG", arrivalIcao: "LFBO" });
  });
});
