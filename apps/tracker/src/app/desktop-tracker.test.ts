import { mkdtempSync, rmSync } from "node:fs";
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

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "weems-desktop-"));
  link = new FakeSimLink();
  link.simulatorRunning = true;
  now = 0;
  desktop = new DesktopTracker({
    apiUrl: "http://127.0.0.1:9", // nothing listens: the pilot is not logged in anyway
    version: "0.1.0",
    dataDir: dir,
    newLink: () => link,
    openBrowser: async () => {
      throw new Error("no browser in tests");
    },
    cipher,
    now: () => now,
    utcNow: () => Date.UTC(2026, 10, 11, 8, 0, 0) + now,
  });
  await tick();
});
afterEach(async () => {
  await desktop.stop();
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
});
