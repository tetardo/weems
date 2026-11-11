import { uuidV7 } from "@weems/contrats";
import { MsfsConnector } from "../connectors/msfs/msfs-connector.ts";
import type { SimLink } from "../connectors/msfs/sim-link.ts";
import { ReplayWriter } from "../connectors/replay/replay-writer.ts";
import { AIRLINER_PARAMS } from "../core/phases/params.ts";
import { createTracker } from "./create-tracker.ts";
import type { ApiClient } from "../sender/api-client.ts";

export interface MsfsTrackerOptions {
  link: SimLink;
  api: ApiClient;
  /** Kept between runs: a flight cut by a crash resumes there (ENF-02). */
  databasePath: string;
  callsign: string;
  flightPlan?: { departureIcao: string; arrivalIcao: string };
  trackerVersion: string;
  /** Receives the replay file line by line; absent = not recorded. */
  record?: (line: string) => void;
  /** What the pilot reads in the terminal. */
  report: (message: string) => void;
  /** Monotonic clock (ms) and UTC clock (ms). */
  now: () => number;
  utcNow: () => number;
  pumpEveryMs?: number;
}

/**
 * The real tracker reading MSFS and sending to the API: `pnpm fly` (J2, without window)
 * and the desktop app (J3). Runs until `stop()`. A flight left open by a stop resumes on the next start.
 */
export function startMsfsTracker(options: MsfsTrackerOptions) {
  const connector = new MsfsConnector({
    link: options.link,
    now: options.now,
    onWarning: (message) => options.report(`Attention : ${message}`),
  });
  if (options.record) new ReplayWriter(options.record).attach(connector);
  const tracker = createTracker({
    connector,
    databasePath: options.databasePath,
    api: options.api,
    session: {
      callsign: options.callsign,
      ...(options.flightPlan && { flightPlan: options.flightPlan }),
      trackerVersion: options.trackerVersion,
      clock: { nowUtcMs: options.utcNow },
      newFlightId: uuidV7,
      params: AIRLINER_PARAMS,
    },
  });
  reportConnector(connector, options.report);

  let shown = "";
  const pump = async () => {
    await tracker.runtime.pump(options.utcNow());
    const { currentFlightId, currentPhase } = tracker.runtime;
    const state = `Vol ${currentFlightId ?? "—"}, phase ${currentPhase ?? "—"}, ${tracker.sender.pendingCount()} message(s) en attente`;
    if (currentFlightId && state !== shown) options.report(state);
    shown = state;
  };
  const timer = setInterval(() => void pump(), options.pumpEveryMs ?? 500);
  const running = tracker.runtime.start();

  return {
    tracker,
    connector,
    /** Manual close by the pilot (EF-12). */
    closeFlight: () => tracker.runtime.closeManually(),
    async stop(): Promise<number> {
      await connector.stop();
      await running;
      clearInterval(timer);
      await pump();
      const pending = tracker.sender.pendingCount();
      tracker.recorder.close();
      return pending;
    },
  };
}

function reportConnector(connector: MsfsConnector, report: (message: string) => void): void {
  connector.onStatus((status) =>
    report(status === "connected" ? "Simulateur connecté." : "Simulateur déconnecté."),
  );
  connector.onAircraft((aircraft) => report(`Avion : ${aircraft.title} (${aircraft.simulator})`));
  connector.onEvent((event) => {
    if (event.type === "crashed" || event.type === "positionChanged")
      report(`Événement : ${event.type}`);
  });
}
