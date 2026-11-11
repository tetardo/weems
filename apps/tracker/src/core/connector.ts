import type { AircraftInfo, Sample, SimEvent } from "@weems/contrats";

export type ConnectorStatus = "disconnected" | "connected" | "loading";

/**
 * What every simulator connector provides (MSFS, replay, X-Plane later).
 * The connector translates and cleans (units, missing values as null);
 * the core only sees objects that follow packages/contrats.
 */
export interface SimConnector {
  readonly name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  /** EF-09: every frame ("high") or once per second ("normal"). Decided by the core. */
  setReadRate(rate: "high" | "normal"): void;
  onStatus(listener: (status: ConnectorStatus) => void): void;
  onAircraft(listener: (aircraft: AircraftInfo) => void): void;
  onSample(listener: (sample: Sample) => void): void;
  onEvent(listener: (event: SimEvent) => void): void;
}
