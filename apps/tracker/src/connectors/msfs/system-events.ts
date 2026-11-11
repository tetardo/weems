import type { SimEvent, SimEventType } from "@weems/contrats";

/** System events the connector subscribes to (simvars.yaml, fiche 02). */
export const SYSTEM_EVENTS = [
  "SimStart",
  "SimStop",
  "Pause_EX1",
  "Crashed",
  "PositionChanged",
  "AircraftLoaded",
  "FlightLoaded",
] as const;
export type SystemEventName = (typeof SYSTEM_EVENTS)[number];

const DIRECT: Partial<Record<SystemEventName, SimEventType>> = {
  Crashed: "crashed",
  PositionChanged: "positionChanged",
  AircraftLoaded: "aircraftLoaded",
  FlightLoaded: "flightLoaded",
};

/**
 * Turns SimConnect system events into core events (spec T0), without the known duplicates:
 * SimStart/SimStop arrive in extra pairs, pause events repeat (pieges.md).
 * Keeps the pause state that every sample carries.
 */
export class SystemEventFilter {
  private running: boolean | null = null;
  private pausedValue = false;

  get paused(): boolean {
    return this.pausedValue;
  }

  /** `data`: the event's value (Pause_EX1: pause flags, 0 = not paused). */
  translate(name: SystemEventName, data: number, t: number): SimEvent | null {
    const direct = DIRECT[name];
    if (direct) return { t, type: direct };
    if (name === "Pause_EX1") return this.pause(data !== 0, t);
    return this.simState(name === "SimStart", t);
  }

  private pause(paused: boolean, t: number): SimEvent | null {
    if (paused === this.pausedValue) return null;
    this.pausedValue = paused;
    return { t, type: paused ? "paused" : "unpaused" };
  }

  private simState(running: boolean, t: number): SimEvent | null {
    if (running === this.running) return null;
    this.running = running;
    return { t, type: running ? "simStarted" : "simStopped" };
  }
}
