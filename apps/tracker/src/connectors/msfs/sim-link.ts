import type { Simulator } from "@weems/contrats";
import type { RawAircraft, RawSample } from "./sim-vars.ts";
import type { SystemEventName } from "./system-events.ts";

/** What the link reports while connected. */
export interface SimLinkHandlers {
  sample(raw: RawSample): void;
  aircraft(raw: RawAircraft): void;
  systemEvent(name: SystemEventName, data: number): void;
  /** SimConnect refused a request (e.g. an unknown SimVar): shown to the pilot, never fatal. */
  warning(message: string): void;
  /** The simulator closed the connection or it broke. */
  closed(): void;
}

/**
 * The connection to the simulator, reduced to what the connector needs.
 * Implemented with SimConnect (simconnect-link.ts, Windows) and by a fake in the tests (Mac).
 */
export interface SimLink {
  /** Rejects when the simulator is not running. */
  open(handlers: SimLinkHandlers): Promise<{ simulator: Simulator }>;
  setSampleRate(rate: "high" | "normal"): void;
  /** Asks the aircraft identity again (strings are never read periodically). */
  requestAircraft(): void;
  close(): void;
}
