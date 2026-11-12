import { join } from "node:path";
import { uuidV7 } from "@weems/contrats";
import { ReplayConnector } from "../../src/connectors/replay/replay-connector.ts";
import { replayFrom, replayUntil } from "../../src/connectors/replay/replay-format.ts";
import { AIRLINER_PARAMS } from "../../src/core/phases/params.ts";
import { flightStarts } from "../../src/core/session.ts";
import { createTracker } from "../../src/runtime/create-tracker.ts";
import type { ApiClient } from "../../src/sender/api-client.ts";
import { generateFlight } from "../generate-flights/generator.ts";
import type { Scenario } from "../generate-flights/scenario.ts";

export interface LiveTrackerOptions {
  api: ApiClient;
  /** Replay speed: 1 = real time, 10 = ten times faster. */
  speed: number;
  /** Folder of the tracker's local database. */
  workDir: string;
  trackerVersion: string;
  /** Starts at the pushback, without the minute of boarding when nothing is sent. */
  skipBoarding?: boolean;
  /** Keeps only what can be played in this many real ms (2 000 pilots in one process). */
  stopAfterMs?: number;
}

/**
 * A headless tracker replaying a synthetic flight in real time (or faster), with the real
 * core, recorder and senders: `pnpm simulate`, the load test and the live simulated activity.
 */
export function liveTracker(scenario: Scenario, options: LiveTrackerOptions) {
  const generated = generateFlight(scenario);
  const flight = options.skipBoarding ? replayFrom(generated, flightStarts) : generated;
  const replay =
    options.stopAfterMs === undefined
      ? flight
      : replayUntil(flight, options.stopAfterMs * options.speed);
  const connector = new ReplayConnector(replay, options.speed);
  const first = flight.records[0]?.t ?? 0;
  const durationMs = Math.max(1, (flight.records.at(-1)?.t ?? first) - first);
  const tracker = createTracker({
    connector,
    databasePath: join(options.workDir, `${scenario.callsign}-${uuidV7()}.db`),
    api: options.api,
    session: {
      callsign: scenario.callsign,
      flightPlan: { departureIcao: scenario.departure.icao, arrivalIcao: scenario.arrival.icao },
      trackerVersion: options.trackerVersion,
      clock: { nowUtcMs: () => Date.now() },
      newFlightId: uuidV7,
      params: AIRLINER_PARAMS,
    },
  });
  return { connector, tracker, durationMs, startedAtMs: Date.now() };
}
