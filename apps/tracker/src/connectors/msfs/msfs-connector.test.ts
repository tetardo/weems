import type { AircraftInfo, Sample, SimEvent } from "@weems/contrats";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConnectorStatus } from "../../core/connector.ts";
import { MsfsConnector } from "./msfs-connector.ts";
import { FakeSimLink as FakeLink } from "./fake-sim-link.ts";
import { rawA320, rawCruise } from "./raw-sample-fixture.ts";

let link: FakeLink;
let connector: MsfsConnector;
let clock: number;
let seen: {
  status: ConnectorStatus[];
  aircraft: AircraftInfo[];
  samples: Sample[];
  events: SimEvent[];
};

beforeEach(() => {
  vi.useFakeTimers();
  link = new FakeLink();
  clock = 0;
  connector = new MsfsConnector({
    link,
    now: () => clock,
    retryDelayMs: 5_000,
    aircraftCheckMs: 30_000,
  });
  seen = { status: [], aircraft: [], samples: [], events: [] };
  connector.onStatus((s) => seen.status.push(s));
  connector.onAircraft((a) => seen.aircraft.push(a));
  connector.onSample((s) => seen.samples.push(s));
  connector.onEvent((e) => seen.events.push(e));
});
afterEach(async () => {
  await connector.stop();
  vi.useRealTimers();
});

describe("MSFS connector", () => {
  it("waits for the simulator, then connects", async () => {
    void connector.start();
    await vi.advanceTimersByTimeAsync(12_000);
    expect(seen.status).toEqual([]);
    link.simulatorRunning = true;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(seen.status).toEqual(["connected"]);
  });

  it("sends samples only once the aircraft is known, with its engine count", async () => {
    link.simulatorRunning = true;
    void connector.start();
    await vi.advanceTimersByTimeAsync(0);
    link.sim.sample(rawCruise());
    link.sim.aircraft(rawA320());
    clock = 1_000;
    link.sim.sample(rawCruise());
    expect(seen.aircraft.map((a) => a.simulator)).toEqual(["msfs2024"]);
    expect(seen.samples).toHaveLength(1);
    expect(seen.samples[0]).toMatchObject({ t: 1_000, engines: [{}, {}] });
  });

  it("reports an aircraft only when it changes, and reads it again on AircraftLoaded", async () => {
    link.simulatorRunning = true;
    void connector.start();
    await vi.advanceTimersByTimeAsync(0);
    link.sim.aircraft(rawA320());
    link.sim.aircraft(rawA320());
    const before = link.aircraftRequests;
    link.sim.systemEvent("AircraftLoaded", 0);
    expect(link.aircraftRequests).toBe(before + 1);
    link.sim.aircraft(rawA320("Cessna 172"));
    expect(seen.aircraft.map((a) => a.title)).toEqual(["Airbus A320neo Weems", "Cessna 172"]);
  });

  it("reads the aircraft again periodically to see a silent change", async () => {
    link.simulatorRunning = true;
    void connector.start();
    await vi.advanceTimersByTimeAsync(0);
    const before = link.aircraftRequests;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(link.aircraftRequests).toBe(before + 2);
  });

  it("marks samples as paused between pause events", async () => {
    link.simulatorRunning = true;
    void connector.start();
    await vi.advanceTimersByTimeAsync(0);
    link.sim.aircraft(rawA320());
    link.sim.systemEvent("Pause_EX1", 1);
    link.sim.sample(rawCruise());
    link.sim.systemEvent("Pause_EX1", 0);
    link.sim.sample(rawCruise());
    expect(seen.samples.map((s) => s.paused)).toEqual([true, false]);
    expect(seen.events.map((e) => e.type)).toEqual(["paused", "unpaused"]);
  });

  it("reports a lost connection and restores it when the simulator comes back", async () => {
    link.simulatorRunning = true;
    void connector.start();
    await vi.advanceTimersByTimeAsync(0);
    clock = 100;
    link.quit();
    await vi.advanceTimersByTimeAsync(5_000);
    link.simulatorRunning = true;
    clock = 200;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(seen.status).toEqual(["connected", "disconnected", "connected"]);
    expect(seen.events).toEqual([
      { t: 100, type: "connectionLost" },
      { t: 200, type: "connectionRestored" },
    ]);
  });

  it("changes the read rate only when it differs, and keeps it after a reconnection", async () => {
    link.simulatorRunning = true;
    void connector.start();
    await vi.advanceTimersByTimeAsync(0);
    connector.setReadRate("normal");
    connector.setReadRate("high");
    connector.setReadRate("high");
    link.quit();
    link.simulatorRunning = true;
    await vi.advanceTimersByTimeAsync(5_000);
    expect(link.rates).toEqual(["high", "high"]);
  });

  it("start() ends when the connector is stopped", async () => {
    link.simulatorRunning = true;
    const running = connector.start();
    await vi.advanceTimersByTimeAsync(0);
    await connector.stop();
    await expect(running).resolves.toBeUndefined();
  });
});
