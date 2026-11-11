import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FlightView } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openSse } from "../../apps/api/src/testing/sse-client.ts";
import { startTestApp } from "../../apps/api/src/testing/test-app.ts";
import { httpApiClient } from "../../apps/tracker/src/sender/api-client.ts";
import { expectedTrace } from "../../apps/tracker/tools/generate-flights/expected-phases.ts";
import { FLEET } from "../../apps/tracker/tools/generate-flights/fleet.ts";
import type { Scenario } from "../../apps/tracker/tools/generate-flights/scenario.ts";
import {
  runSimulation,
  type SimulatedFlight,
} from "../../apps/tracker/tools/simulate/simulation.ts";
import { longestGapMs, missingSeqs, observe } from "./live-observer.ts";
import { RecordingClient } from "./recording-client.ts";

/**
 * J1 exit test (spec J1, part 5): 10 simulated pilots at ×10 through the real tracker,
 * the real API and its live stream, plus 2 more pilots whose network is cut for 70 s.
 * About 7 minutes: run by `pnpm test:j1`, not by `pnpm check`.
 */
const SPEED = 10;
const OUTAGE_AFTER_MS = 90_000;
/**
 * Criterion 6 asks for 60 s; the cut lasts 70 s so that the API's 60 s silence rule surely greys
 * the aircraft (with exactly 60 s, the silence only passes 60 s by the time since the last position
 * before the cut, sometimes too little before the next sweep: the test failed now and then).
 */
const OUTAGE_MS = 70_000;

let api: Awaited<ReturnType<typeof startTestApp>>;
let baseUrl: string;
let dir: string;
let stream: ReturnType<typeof openSse>;
const normal = { flights: [] as SimulatedFlight[], client: null as unknown as RecordingClient };
const outage = { flights: [] as SimulatedFlight[], client: null as unknown as RecordingClient };
let outageEndMs = 0;

const OUTAGE_FLEET: Scenario[] = [FLEET[0], FLEET[3]].map((scenario, index) => ({
  ...(scenario as Scenario),
  callsign: `WMS${201 + index}`,
}));

function simulate(scenarios: readonly Scenario[], client: RecordingClient, name: string) {
  return runSimulation({
    scenarios,
    api: client,
    speed: SPEED,
    staggerS: 30,
    workDir: join(dir, name),
    trackerVersion: "0.1.0",
  });
}

beforeAll(async () => {
  api = await startTestApp();
  await api.app.listen({ port: 0, host: "127.0.0.1" });
  baseUrl = `http://127.0.0.1:${(api.app.server.address() as AddressInfo).port}`;
  dir = mkdtempSync(join(tmpdir(), "weems-j1-"));
  stream = openSse(`${baseUrl}/v1/live/stream`);
  const http = httpApiClient({ baseUrl, token: "dev-token", trackerVersion: "0.1.0" });
  normal.client = new RecordingClient(http);
  outage.client = new RecordingClient(http);
  setTimeout(() => {
    outage.client.cut(OUTAGE_MS);
    outageEndMs = Date.now() + OUTAGE_MS;
  }, OUTAGE_AFTER_MS);
  [normal.flights, outage.flights] = await Promise.all([
    simulate(FLEET, normal.client, "normal"),
    simulate(OUTAGE_FLEET, outage.client, "outage"),
  ]);
  await new Promise((resolve) => setTimeout(resolve, 3_000)); // last stream batch
  await stream.close();
}, 900_000);

afterAll(async () => {
  await api.stop();
  rmSync(dir, { recursive: true, force: true });
});

async function readFlight(flightId: string): Promise<FlightView> {
  const response = await fetch(`${baseUrl}/v1/flights/${flightId}`, {
    headers: { authorization: "Bearer dev-token" },
  });
  return (await response.json()) as FlightView;
}

/** Same notation as the generator tests: phases, "*event", then "closed:reason". */
const traceOf = (view: FlightView) =>
  [
    ...view.events.map((e) => (e.type === "phaseChanged" ? String(e.context["to"]) : `*${e.type}`)),
    `closed:${view.closeReason}`,
  ].join(" ");

const idOf = (flight: SimulatedFlight) => flight.flightId ?? "never opened";

describe("J1: 10 simulated pilots on the live map", () => {
  it("flies the 10 flights at the same time, from boarding to arrival (criterion 1)", () => {
    expect(normal.flights.map((f) => f.pending)).toEqual(FLEET.map(() => 0));
    expect(observe(stream.events).mostShown).toBeGreaterThanOrEqual(FLEET.length);
  });

  it("stores the expected phases and events of each scenario (criterion 5)", async () => {
    for (const flight of normal.flights) {
      const view = await readFlight(idOf(flight));
      expect(traceOf(view), flight.scenario.name).toBe(
        `${expectedTrace(flight.scenario.disturbances)} closed:normal`,
      );
      expect(view.events.map((e) => e.seq)).toEqual(view.events.map((_, i) => i + 1));
    }
  });

  it("loses no position on the way (criterion 2)", () => {
    for (const flight of normal.flights) {
      const accepted = normal.client.accepted.get(idOf(flight)) ?? new Set<number>();
      expect(accepted.size, flight.scenario.name).toBeGreaterThan(0);
      expect(missingSeqs(accepted), flight.scenario.name).toEqual([]);
    }
  });

  it("updates each aircraft at least every 20 s, then removes it (criterion 3)", async ({
    annotate,
  }) => {
    const { sightings, removedAtMs, stillShown } = observe(stream.events);
    const gaps = normal.flights.map((f) => longestGapMs(sightings.get(idOf(f)) ?? []));
    await annotate(`longest time without update: ${Math.max(...gaps)} ms`);
    for (const flight of normal.flights) {
      expect(longestGapMs(sightings.get(idOf(flight)) ?? []), flight.scenario.name).toBeLessThan(
        20_000,
      );
      expect(removedAtMs.has(idOf(flight)), flight.scenario.name).toBe(true);
    }
    expect(stillShown).toEqual([]);
  });

  it("shows a position less than 3 s after the tracker sent it (criterion 4)", async ({
    annotate,
  }) => {
    const { sightings } = observe(stream.events);
    const delays = normal.flights.flatMap((flight) => {
      const sent = normal.client.sentAtMs.get(idOf(flight)) ?? new Map<number, number>();
      return (sightings.get(idOf(flight)) ?? [])
        .filter((s) => sent.has(s.seq))
        .map((s) => s.receivedAtMs - (sent.get(s.seq) ?? 0));
    });
    await annotate(`delay over ${delays.length} positions: max ${Math.max(...delays)} ms`);
    expect(delays.length).toBeGreaterThan(100);
    expect(Math.max(...delays)).toBeLessThan(3_000);
  });
});

describe("J1: 60 s network outage (criterion 6)", () => {
  it("loses no event and closes the flights normally", async () => {
    expect(outageEndMs).toBeGreaterThan(0);
    for (const flight of outage.flights) {
      expect(flight.pending).toBe(0);
      const view = await readFlight(idOf(flight));
      expect(traceOf(view)).toBe(`${expectedTrace(flight.scenario.disturbances)} closed:normal`);
      expect(view.events.map((e) => e.seq)).toEqual(view.events.map((_, i) => i + 1));
    }
  });

  it("greys the aircraft during the outage, then moves it again", () => {
    const { sightings } = observe(stream.events);
    for (const flight of outage.flights) {
      const list = sightings.get(idOf(flight)) ?? [];
      const lost = list.find((s) => s.signal === "lost");
      expect(lost, flight.scenario.callsign).toBeDefined();
      const back = list.find((s) => s.receivedAtMs > outageEndMs && s.signal === "ok");
      expect(back?.seq ?? 0).toBeGreaterThan(lost?.seq ?? Infinity);
    }
  });
});
