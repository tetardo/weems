import type { AircraftInfo, Sample, SimEvent } from "@weems/contrats";
import type { ConnectorStatus, SimConnector } from "../core/connector.ts";

type Listener<T> = (value: T) => void;

/** The listeners of a connector and how to call them: shared by every connector. */
export class ConnectorListeners implements Pick<
  SimConnector,
  "onStatus" | "onAircraft" | "onSample" | "onEvent"
> {
  private readonly statusListeners: Listener<ConnectorStatus>[] = [];
  private readonly aircraftListeners: Listener<AircraftInfo>[] = [];
  private readonly sampleListeners: Listener<Sample>[] = [];
  private readonly eventListeners: Listener<SimEvent>[] = [];

  onStatus(listener: Listener<ConnectorStatus>): void {
    this.statusListeners.push(listener);
  }
  onAircraft(listener: Listener<AircraftInfo>): void {
    this.aircraftListeners.push(listener);
  }
  onSample(listener: Listener<Sample>): void {
    this.sampleListeners.push(listener);
  }
  onEvent(listener: Listener<SimEvent>): void {
    this.eventListeners.push(listener);
  }

  emitStatus(status: ConnectorStatus): void {
    this.statusListeners.forEach((l) => l(status));
  }
  emitAircraft(aircraft: AircraftInfo): void {
    this.aircraftListeners.forEach((l) => l(aircraft));
  }
  emitSample(sample: Sample): void {
    this.sampleListeners.forEach((l) => l(sample));
  }
  emitEvent(event: SimEvent): void {
    this.eventListeners.forEach((l) => l(event));
  }
}
