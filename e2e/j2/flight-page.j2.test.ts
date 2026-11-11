import type { AddressInfo } from "node:net";
import { type Browser, chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp } from "../../apps/api/src/testing/test-app.ts";
import { startSite } from "./site-server.ts";
import { sendTwoHourFlight, TWO_HOUR_PHASES } from "./two-hour-flight.ts";

/**
 * J2 exit criteria of the site (spec J2): a 2-hour flight page shows in under 2 seconds (4),
 * with the tracker's phases (site criterion 2), in French and English (5).
 */
const MAX_LOAD_MS = 2_000;

let api: Awaited<ReturnType<typeof startTestApp>>;
let site: Awaited<ReturnType<typeof startSite>>;
let browser: Browser;
let flightId: string;
let apiUrl: string;

beforeAll(async () => {
  api = await startTestApp();
  await api.app.listen({ port: 0, host: "127.0.0.1" });
  apiUrl = `http://127.0.0.1:${(api.app.server.address() as AddressInfo).port}`;
  flightId = await sendTwoHourFlight(apiUrl);
  site = await startSite(3_100 + Math.floor(Math.random() * 800), apiUrl);
  // CHROMIUM_PATH: a browser already installed (Claude Code sandbox); otherwise Playwright's own.
  const executablePath = process.env["CHROMIUM_PATH"];
  browser = await chromium.launch(executablePath ? { executablePath } : {});
});
afterAll(async () => {
  await browser?.close();
  site?.stop();
  await api?.stop();
});

/** Opens the flight page and waits until the map and the profile are drawn. */
async function openFlight(locale: "fr" | "en") {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const started = performance.now();
  await page.goto(`${site.url}/${locale}/flights/${flightId}`);
  await page.waitForSelector("svg[role=img] path");
  await page.waitForSelector(".maplibregl-canvas");
  return { page, ms: performance.now() - started };
}

describe("J2 flight page", () => {
  it(`shows a 2-hour flight in under ${MAX_LOAD_MS} ms (criterion 4)`, async ({ annotate }) => {
    await (await openFlight("fr")).page.close(); // first visit: server warm-up
    const times: number[] = [];
    for (let i = 0; i < 3; i++) {
      const { page, ms } = await openFlight("fr");
      times.push(ms);
      await page.close();
    }
    await annotate(`load times: ${times.map(Math.round).join(", ")} ms`);
    expect(Math.max(...times)).toBeLessThan(MAX_LOAD_MS);
  });

  it("lists the tracker's phases, in French and in English (criterion 5)", async () => {
    const cruise = TWO_HOUR_PHASES.indexOf("CRUISE");
    const french = await openFlight("fr");
    const frenchRows = await french.page
      .locator("table")
      .first()
      .locator("tbody tr")
      .allInnerTexts();
    expect(frenchRows).toHaveLength(TWO_HOUR_PHASES.length);
    expect(frenchRows[cruise]).toContain("Croisière");
    await french.page.close();

    const english = await openFlight("en");
    const englishRows = await english.page
      .locator("table")
      .first()
      .locator("tbody tr")
      .allInnerTexts();
    expect(englishRows[cruise]).toContain("Cruise");
    await expect(english.page.locator("h2").first().innerText()).resolves.toBe("Track");
    await english.page.close();
  });

  it("draws the simplified track: at most 500 points for 7 200 recorded", async () => {
    const response = await fetch(`${apiUrl}/v1/flights/${flightId}/track`, {
      headers: { authorization: "Bearer dev-token" },
    });
    const track = (await response.json()) as { recordedPoints: number; points: unknown[] };
    expect(track.recordedPoints).toBe(7_200);
    expect(track.points.length).toBeGreaterThan(100);
    expect(track.points.length).toBeLessThanOrEqual(500);
  });
});
