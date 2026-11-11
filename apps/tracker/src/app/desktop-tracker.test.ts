import { mkdtempSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FakeSimLink } from "../connectors/msfs/fake-sim-link.ts";
import { rawFromAircraft, rawFromSample } from "../connectors/msfs/raw-sample-fixture.ts";
import { generateFlight } from "../../tools/generate-flights/generator.ts";
import { LFPG_LFBO } from "../../tools/generate-flights/scenario.ts";
import { DesktopTracker } from "./desktop-tracker.ts";

const cipher = {
  encrypt: (text: string) => Buffer.from(text),
  decrypt: (data: Buffer) => data.toString(),
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

let dir: string;
let link: FakeSimLink;
let now: number;
let desktop: DesktopTracker;
let opened: string[];
let api: Server;

/** A stand-in API that only answers GET /v1/tracker/login (the pilot stays logged out). */
async function startApi(): Promise<string> {
  api = createServer((request, response) => {
    if (request.url !== "/v1/tracker/login") return void response.writeHead(404).end();
    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({
        authorizationEndpoint: "http://127.0.0.1:1/oauth2/authorize",
        tokenEndpoint: "http://127.0.0.1:1/oauth2/token",
        clientId: "weems-tracker",
        scopes: ["openid"],
        resource: "http://127.0.0.1:1",
        redirectPath: "/callback",
        siteUrl: "https://site.example",
      }),
    );
  });
  await new Promise<void>((resolve) => api.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(api.address() as AddressInfo).port}`;
}

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "weems-desktop-"));
  link = new FakeSimLink();
  link.simulatorRunning = true;
  now = 0;
  opened = [];
  desktop = new DesktopTracker({
    apiUrl: await startApi(),
    version: "0.1.0",
    dataDir: dir,
    newLink: () => link,
    openBrowser: async (url) => {
      opened.push(url);
      if (!url.startsWith("https://site.example/flights/")) throw new Error("no login in tests");
    },
    cipher,
    now: () => now,
    utcNow: () => Date.UTC(2026, 10, 11, 8, 0, 0) + now,
  });
  await tick();
});
afterEach(async () => {
  await desktop.stop();
  await new Promise((resolve) => api.close(resolve));
  rmSync(dir, { recursive: true, force: true });
});

/** The simulator plays the start of a synthetic flight, until the tracker opens it. */
function flyUntilOpened() {
  const flight = generateFlight({ ...LFPG_LFBO, disturbances: [] });
  for (const record of flight.records) {
    now = record.t;
    if (record.type === "aircraft") link.sim.aircraft(rawFromAircraft(record.data));
    if (record.type === "sample") link.sim.sample(rawFromSample(record.data));
    if (desktop.state().flight) return;
  }
  throw new Error("the flight never opened");
}

describe("desktop tracker (without Electron)", () => {
  it("shows the simulator, the aircraft and the flight, logged out", () => {
    flyUntilOpened();
    const state = desktop.state();
    expect(state).toMatchObject({ loggedIn: false, simulator: "connected" });
    expect(state.pending).toBeGreaterThan(0); // kept until the pilot logs in
    expect(state.aircraft).toEqual(expect.any(String));
    expect(state.flight?.id).toEqual(expect.any(String));
  });

  it("keeps the flight settings, but not while a flight is recorded", async () => {
    await desktop.saveSettings({ callsign: "AFR123", departureIcao: "LFPG", arrivalIcao: "LFBO" });
    expect(desktop.state()).toMatchObject({ settings: { callsign: "AFR123" }, notice: null });

    await desktop.saveSettings({ callsign: "bad callsign!", departureIcao: "", arrivalIcao: "" });
    expect(desktop.state().notice).toBe("invalidSettings");

    flyUntilOpened();
    await desktop.saveSettings({ callsign: "AFR456", departureIcao: "", arrivalIcao: "" });
    expect(desktop.state()).toMatchObject({
      settings: { callsign: "AFR123" },
      notice: "flightInProgress",
    });
  });

  it("says when the login could not be done", async () => {
    await desktop.logIn();
    expect(desktop.state()).toMatchObject({
      loggedIn: false,
      loggingIn: false,
      notice: "loginFailed",
    });
  });

  it("shows the last flight once closed, and opens its report on the site", async () => {
    flyUntilOpened();
    desktop.closeFlight();
    await tick();
    const last = desktop.state().lastFlight;
    expect(last).toMatchObject({
      aircraftTitle: expect.any(String),
      closeReason: "manual",
      delivery: "waiting", // logged out: kept on the PC
    });

    await desktop.openReport();
    expect(opened).toEqual([`https://site.example/flights/${last?.flightId}`]);
    expect(desktop.state().notice).toBeNull();
  });
});
