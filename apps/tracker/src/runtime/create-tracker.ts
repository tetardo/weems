import type { SimConnector } from "../core/connector.ts";
import type { SessionOptions } from "../core/session.ts";
import type { ApiClient } from "../sender/api-client.ts";
import { OutboxSender } from "../sender/outbox-sender.ts";
import { PositionQueue } from "../sender/position-queue.ts";
import { Recorder } from "../storage/recorder.ts";
import { TrackerRuntime } from "./tracker-runtime.ts";

export interface TrackerSetup {
  connector: SimConnector;
  /** Local SQLite file. */
  databasePath: string;
  api: ApiClient;
  session: SessionOptions;
  /** For retry jitter; seeded in tests. */
  random?: () => number;
}

/** Builds a complete tracker (without window): recorder, senders and runtime. */
export function createTracker(setup: TrackerSetup) {
  const recorder = new Recorder(setup.databasePath);
  const sender = new OutboxSender(recorder.db, setup.api, setup.random);
  const runtime = new TrackerRuntime({
    connector: setup.connector,
    recorder,
    sender,
    positions: new PositionQueue(setup.api),
    session: setup.session,
  });
  return { runtime, recorder, sender };
}
