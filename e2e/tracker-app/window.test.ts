import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron, type ElectronApplication, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Recorder } from "../../apps/tracker/src/storage/recorder.ts";

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

/** A flight closed earlier on this PC, never sent (the pilot was not logged in). */
function seedLastFlight(dir: string): void {
  const recorder = new Recorder(join(dir, "tracker.db"));
  const flightId = "0197a000-0000-7000-8000-000000000001";
  recorder.open({
    flightId,
    callsign: "WMS1",
    aircraft: {
      simulator: "msfs2024",
      title: "Airbus A320neo",
      model: null,
      registration: null,
      engineCount: 2,
      emptyWeightKg: null,
    },
    departureIcao: "LFPG",
    plannedArrivalIcao: "LFBO",
    openedAt: "2026-11-11T08:00:00.000Z",
    trackerVersion: version,
  });
  const at = "2026-11-11T09:10:00.000Z";
  recorder.event(flightId, { seq: 1, at, type: "goAround", context: {} });
  recorder.event(flightId, { seq: 2, at, type: "touchdown", context: { vs: -142.6 } });
  recorder.closeFlight(flightId, { closedAt: "2026-11-11T09:25:00.000Z", reason: "normal" });
  recorder.close();
}

let dataDir: string;
let app: ElectronApplication;
let page: Page;

beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), "weems-tracker-app-"));
  seedLastFlight(dataDir);
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

  it("asks for departure and arrival before any flight (decision 004)", async () => {
    await expect.poll(() => page.textContent("#flight-status")).toMatch(/^Saisissez le départ/);
    await page.fill("[name=callsign]", "wms42");
    await page.click("#settings [type=submit]");
    expect(await page.locator("[name=departureIcao]:invalid").count()).toBe(1);
    expect(existsSync(join(dataDir, "settings.json"))).toBe(false);
  });

  it("shows the last flight, kept on the PC until it is sent", async () => {
    await expect.poll(() => page.textContent("#last-flight-summary")).toMatch(/^Airbus A320neo · /);
    expect(await page.textContent("#last-flight-summary")).toMatch(/\(1 h 25\)$/);
    expect(await page.textContent("#last-flight-landing")).toBe(
      "Toucher -143 ft/min · 1 remise(s) des gaz",
    );
    expect(await page.textContent("#last-flight-delivery")).toBe("En attente d'envoi.");
    expect(await page.isVisible("#open-report")).toBe(false);
  });

  it("refuses a malformed callsign and keeps a valid next flight on the PC", async () => {
    await page.fill("[name=callsign]", "W");
    await page.fill("[name=departureIcao]", "lfpg");
    await page.fill("[name=arrivalIcao]", "lfbo");
    await page.click("#settings [type=submit]");
    await expect.poll(() => page.textContent("#notice")).not.toBe("");

    await page.fill("[name=callsign]", "wms42");
    await page.click("#settings [type=submit]");
    await expect.poll(() => page.textContent("#notice")).toBe("");
    await expect.poll(() => page.textContent("#flight-status")).toMatch(/^Aucun vol/);
    const saved = JSON.parse(readFileSync(join(dataDir, "settings.json"), "utf8")) as unknown;
    expect(saved).toEqual({ callsign: "WMS42", departureIcao: "LFPG", arrivalIcao: "LFBO" });
  });
});
