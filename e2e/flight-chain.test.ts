import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type FlightEvent, type OpenFlightRequest, uuidV7 } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp } from "../apps/api/src/testing/test-app.ts";
import { ReplayConnector } from "../apps/tracker/src/connectors/replay/replay-connector.ts";
import { AIRLINER_PARAMS } from "../apps/tracker/src/core/phases/params.ts";
import { createTracker } from "../apps/tracker/src/runtime/create-tracker.ts";
import { httpApiClient } from "../apps/tracker/src/sender/api-client.ts";
import { generateFlight } from "../apps/tracker/tools/generate-flights/generator.ts";
import { LFPG_LFBO } from "../apps/tracker/tools/generate-flights/scenario.ts";

/**
 * J0 exit criterion 2: a synthetic flight goes through the real tracker
 * (replay connector, core, SQLite recorder, outbox, HTTP) to the real API and database,
 * and reading it back gives exactly what the tracker recorded.
 */
let api: Awaited<ReturnType<typeof startTestApp>>;
let baseUrl: string;
let dir: string;

beforeAll(async () => {
  api = await startTestApp();
  await api.app.listen({ port: 0, host: "127.0.0.1" });
  baseUrl = `http://127.0.0.1:${(api.app.server.address() as AddressInfo).port}`;
  dir = mkdtempSync(join(tmpdir(), "weems-e2e-"));
});
afterAll(async () => {
  await api.stop();
  rmSync(dir, { recursive: true, force: true });
});

async function flyThroughTheChain() {
  const { runtime, recorder, sender } = createTracker({
    connector: new ReplayConnector(
      generateFlight({ ...LFPG_LFBO, disturbances: ["goAround", "bounce"] }),
    ),
    databasePath: join(dir, "tracker.db"),
    api: httpApiClient({ baseUrl, token: "dev-token", trackerVersion: "0.1.0" }),
    session: {
      callsign: "WMS123",
      trackerVersion: "0.1.0",
      clock: { nowUtcMs: () => Date.UTC(2026, 10, 11, 8, 0, 0) },
      newFlightId: uuidV7,
      params: AIRLINER_PARAMS,
    },
  });
  await runtime.start();
  await runtime.pump(Date.now());
  return { recorder, sender, flightId: runtime.currentFlightId };
}

describe("tracker to API", () => {
  it("delivers a synthetic flight that reads back identical (J0 criterion 2)", async () => {
    const { recorder, sender, flightId } = await flyThroughTheChain();
    expect(sender.pendingCount()).toBe(0);

    const recordedEvents = recorder.db
      .prepare("SELECT data FROM events WHERE flight_id = ? ORDER BY seq")
      .all(flightId)
      .map((row) => JSON.parse((row as { data: string }).data) as FlightEvent);
    recorder.close();

    const response = await fetch(`${baseUrl}/v1/flights/${flightId}`, {
      headers: { authorization: "Bearer dev-token" },
    });
    const view = (await response.json()) as Omit<OpenFlightRequest, "trackerVersion"> & {
      events: FlightEvent[];
      closeReason: string;
      lastPhase: string;
    };
    expect(view).toMatchObject({
      flightId,
      callsign: "WMS123",
      aircraft: LFPG_LFBO.aircraft,
      openedAt: "2026-11-11T08:00:00.000Z",
    });
    expect(view.events).toEqual(recordedEvents);
    expect(view.closeReason).toBe("normal");
    expect(view.lastPhase).toBe("ARRIVED");
    expect(view.events.map((e) => e.type)).toEqual(
      expect.arrayContaining(["goAround", "touchdown", "bounce"]),
    );
  });
});
