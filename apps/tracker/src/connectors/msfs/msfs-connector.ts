import type { AircraftInfo, Simulator } from "@weems/contrats";
import type { SimConnector } from "../../core/connector.ts";
import { ConnectorListeners } from "../connector-listeners.ts";
import type { SimLink, SimLinkHandlers } from "./sim-link.ts";
import type { RawAircraft, RawSample } from "./sim-vars.ts";
import { type SystemEventName, SystemEventFilter } from "./system-events.ts";
import { toAircraft, toSample } from "./to-sample.ts";

export interface MsfsConnectorOptions {
  link: SimLink;
  /** Monotonic clock in ms (performance.now in production). */
  now: () => number;
  /** Wait between two connection attempts while the simulator is closed. */
  retryDelayMs?: number;
  /** The aircraft identity is read again this often, to see a change of aircraft. */
  aircraftCheckMs?: number;
  /** SimConnect warnings (unknown SimVar…): shown to the pilot. */
  onWarning?: (message: string) => void;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Microsoft Flight Simulator 2020 and 2024 through SimConnect (lot T1, spec J2).
 * Connects when the simulator is running, reconnects after a loss, translates everything
 * into packages/contrats objects. The SimConnect calls themselves are in the SimLink.
 */
export class MsfsConnector extends ConnectorListeners implements SimConnector {
  readonly name = "msfs";
  private readonly options: Required<MsfsConnectorOptions>;
  private readonly events = new SystemEventFilter();
  private simulator: Simulator = "msfs2020";
  private aircraft: AircraftInfo | null = null;
  private rate: "high" | "normal" = "normal";
  private stopped = false;
  private everConnected = false;
  private wakeUp: (() => void) | null = null;

  constructor(options: MsfsConnectorOptions) {
    super();
    this.options = {
      retryDelayMs: 5_000,
      aircraftCheckMs: 30_000,
      onWarning: () => {},
      ...options,
    };
  }

  /** Runs until `stop()`: connects, waits for the end of the connection, starts again. */
  async start(): Promise<void> {
    this.stopped = false;
    while (!this.stopped) {
      const connected = await this.connect();
      if (connected) await this.untilClosed();
      if (!this.stopped) await this.waitBeforeRetry();
    }
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.options.link.close();
    this.wakeUp?.();
  }

  setReadRate(rate: "high" | "normal"): void {
    if (rate === this.rate) return;
    this.rate = rate;
    this.options.link.setSampleRate(rate);
  }

  private get t(): number {
    return Math.round(this.options.now());
  }

  private async connect(): Promise<boolean> {
    try {
      const { simulator } = await this.options.link.open(this.handlers());
      this.simulator = simulator;
    } catch {
      return false; // simulator not running yet
    }
    if (this.rate !== "normal") this.options.link.setSampleRate(this.rate);
    this.emitStatus("connected");
    if (this.everConnected) this.emitEvent({ t: this.t, type: "connectionRestored" });
    this.everConnected = true;
    return true;
  }

  /** Resolves when the link reports `closed` (or on stop), checking the aircraft meanwhile. */
  private async untilClosed(): Promise<void> {
    const check = setInterval(
      () => this.options.link.requestAircraft(),
      this.options.aircraftCheckMs,
    );
    await new Promise<void>((resolve) => (this.wakeUp = resolve));
    clearInterval(check);
    this.wakeUp = null;
  }

  private async waitBeforeRetry(): Promise<void> {
    await Promise.race([
      sleep(this.options.retryDelayMs),
      new Promise<void>((resolve) => (this.wakeUp = resolve)),
    ]);
    this.wakeUp = null;
  }

  private handlers(): SimLinkHandlers {
    return {
      sample: (raw) => this.onRawSample(raw),
      aircraft: (raw) => this.onRawAircraft(raw),
      systemEvent: (name, data) => this.onSystemEvent(name, data),
      warning: (message) => this.options.onWarning(message),
      closed: () => this.onClosed(),
    };
  }

  private onRawSample(raw: RawSample): void {
    if (!this.aircraft) return; // the engine count comes with the aircraft
    const context = {
      t: this.t,
      paused: this.events.paused,
      engineCount: this.aircraft.engineCount,
    };
    const sample = toSample(raw, context);
    if (sample) this.emitSample(sample);
  }

  /** Sent to the core only when it changed: it is read again every `aircraftCheckMs`. */
  private onRawAircraft(raw: RawAircraft): void {
    const aircraft = toAircraft(raw, this.simulator);
    if (!aircraft || JSON.stringify(aircraft) === JSON.stringify(this.aircraft)) return;
    this.aircraft = aircraft;
    this.emitAircraft(aircraft);
  }

  private onSystemEvent(name: SystemEventName, data: number): void {
    if (name === "AircraftLoaded" || name === "FlightLoaded") this.options.link.requestAircraft();
    const event = this.events.translate(name, data, this.t);
    if (event) this.emitEvent(event);
  }

  private onClosed(): void {
    if (this.stopped) return;
    this.emitEvent({ t: this.t, type: "connectionLost" });
    this.emitStatus("disconnected");
    this.wakeUp?.();
  }
}
