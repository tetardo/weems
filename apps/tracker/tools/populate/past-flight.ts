import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { uuidV7 } from "@weems/contrats";
import { ReplayConnector } from "../../src/connectors/replay/replay-connector.ts";
import { AIRLINER_PARAMS } from "../../src/core/phases/params.ts";
import { createTracker } from "../../src/runtime/create-tracker.ts";
import type { ApiClient } from "../../src/sender/api-client.ts";
import { generateFlight } from "../generate-flights/generator.ts";
import type { Scenario } from "../generate-flights/scenario.ts";

export interface PastFlight {
  scenario: Scenario;
  /** When the tracker opens the flight (UTC ms, in the past). */
  openedAtMs: number;
}

export interface PastFlightOptions {
  api: ApiClient;
  /** Folder for the flight's local database, deleted afterwards. */
  workDir: string;
  trackerVersion: string;
  /** Real ms between two sending rounds while the outbox empties. */
  pumpEveryMs?: number;
  /** Real ms after which a flight still waiting to be sent is abandoned. */
  drainTimeoutMs?: number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Flies one past flight through the real tracker (core, recorder, sender) as fast as the
 * machine allows: the replay is played at once and the clock is frozen at the opening, so the
 * flight carries the times of its day in the past (page Activité simulée). Returns the messages
 * left unsent (0 when the API received everything).
 */
export async function flyPastFlight(
  flight: PastFlight,
  options: PastFlightOptions,
): Promise<number> {
  mkdirSync(options.workDir, { recursive: true });
  const databasePath = join(options.workDir, `${uuidV7()}.db`);
  const { scenario } = flight;
  const tracker = createTracker({
    connector: new ReplayConnector(generateFlight(scenario), "instant"),
    databasePath,
    api: options.api,
    session: {
      callsign: scenario.callsign,
      flightPlan: { departureIcao: scenario.departure.icao, arrivalIcao: scenario.arrival.icao },
      trackerVersion: options.trackerVersion,
      clock: { nowUtcMs: () => flight.openedAtMs },
      newFlightId: uuidV7,
      params: AIRLINER_PARAMS,
    },
  });
  try {
    await tracker.runtime.start();
    const end = Date.now() + (options.drainTimeoutMs ?? 60_000);
    await tracker.runtime.pump(Date.now());
    while (tracker.sender.pendingCount() > 0 && Date.now() < end) {
      await wait(options.pumpEveryMs ?? 20);
      await tracker.runtime.pump(Date.now());
    }
    return tracker.sender.pendingCount();
  } finally {
    tracker.recorder.close();
    for (const suffix of ["", "-wal", "-shm"]) rmSync(`${databasePath}${suffix}`, { force: true });
  }
}
