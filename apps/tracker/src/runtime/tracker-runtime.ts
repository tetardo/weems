import type {
  AircraftInfo,
  CloseFlightRequest,
  FlightEvent,
  FlightPhase,
  OpenFlightRequest,
  PositionReport,
  Sample,
} from "@weems/contrats";
import type { SimConnector } from "../core/connector.ts";
import { decideRecovery, type SavedFlight } from "../core/recovery.ts";
import { FlightSession, type SessionOptions, type SessionOutput } from "../core/session.ts";
import type { OutboxSender } from "../sender/outbox-sender.ts";
import type { PositionQueue } from "../sender/position-queue.ts";
import type { Recorder } from "../storage/recorder.ts";

export interface RuntimeParts {
  connector: SimConnector;
  recorder: Recorder;
  sender: OutboxSender;
  positions: PositionQueue;
  session: SessionOptions;
}

/**
 * Wires connector → session (core) → recorder → sender. Holds no flight rule itself.
 * `pump` runs every half second: writes buffered samples, sends the outbox, then live positions.
 */
export class TrackerRuntime {
  private session: FlightSession;
  private flightId: string | null = null;
  private aircraft: AircraftInfo | null = null;
  private saved: SavedFlight | null;
  private readonly parts: RuntimeParts;

  constructor(parts: RuntimeParts) {
    this.parts = parts;
    this.saved = this.closeAllButLastUnfinished();
    this.session = this.newSession();
  }

  /** The flight being recorded, if any. */
  get currentFlightId(): string | null {
    return this.flightId;
  }

  async start(): Promise<void> {
    const { connector } = this.parts;
    connector.onAircraft((aircraft) => this.onAircraft(aircraft));
    connector.onSample((sample) => this.onSample(sample));
    connector.onEvent((event) => this.session.handleSimEvent(event));
    await connector.start();
  }

  /** Phase of the flight being recorded (null before the first one). */
  get currentPhase(): FlightPhase | null {
    return this.session.phase;
  }

  closeManually(): void {
    this.session.closeManually();
  }

  /** Closes the flight being recorded as interrupted (simulation stopped). */
  interruptFlight(): void {
    this.session.interrupt();
  }

  async pump(nowMs: number): Promise<void> {
    this.parts.recorder.flush();
    const { sender, positions } = this.parts;
    await sender.drain(nowMs);
    await positions.flush(nowMs, (flightId) => sender.isOpened(flightId));
  }

  private onAircraft(aircraft: AircraftInfo): void {
    if (this.session.state === "closed") this.session = this.newSession();
    this.aircraft = aircraft;
    this.session.setAircraft(aircraft);
  }

  private onSample(sample: Sample): void {
    // Recorded before the session sees it: the sample that closes the flight (ARRIVED)
    // must be in the trajectory built at closing.
    const wasFlying = this.session.state === "flying";
    if (wasFlying) this.recordSample(sample);
    if (this.saved && this.aircraft) this.recover(this.saved, this.aircraft, sample);
    else this.session.handleSample(sample);
    if (!wasFlying && this.session.state === "flying") this.recordSample(sample); // opened or resumed
    this.parts.connector.setReadRate(this.session.readRate);
  }

  private recordSample(sample: Sample): void {
    const at = this.session.utcAt(sample.t);
    if (this.flightId && at) this.parts.recorder.sample(this.flightId, sample, at);
  }

  /** ENF-02: first sample after a crash of the tracker or the PC. */
  private recover(saved: SavedFlight, aircraft: AircraftInfo, sample: Sample): void {
    this.saved = null;
    const utcMs = this.parts.session.clock.nowUtcMs();
    const decision = decideRecovery(saved, {
      aircraftTitle: aircraft.title,
      lat: sample.lat,
      lon: sample.lon,
      utcMs,
    });
    if (decision === "resume") {
      this.flightId = saved.flightId;
      this.session.resume(saved, sample);
      return;
    }
    this.interrupt(saved);
    this.session.handleSample(sample);
  }

  private interrupt(saved: SavedFlight): void {
    const closedAt = saved.lastAt ?? new Date(this.parts.session.clock.nowUtcMs()).toISOString();
    this.parts.recorder.closeFlight(saved.flightId, { closedAt, reason: "interrupted" });
  }

  /** Only the most recent unfinished flight may resume; older ones are closed as interrupted. */
  private closeAllButLastUnfinished(): SavedFlight | null {
    const unfinished = this.parts.recorder.unfinishedFlights();
    unfinished.slice(0, -1).forEach((saved) => this.interrupt(saved));
    return unfinished.at(-1) ?? null;
  }

  private newSession(): FlightSession {
    const { recorder } = this.parts;
    const output: SessionOutput = {
      open: (request: OpenFlightRequest) => {
        this.flightId = request.flightId;
        recorder.open(request);
      },
      event: (event: FlightEvent) => {
        if (this.flightId) recorder.event(this.flightId, event);
      },
      position: (report: PositionReport) => {
        if (!this.flightId) return;
        recorder.position(this.flightId, report);
        this.parts.positions.push(this.flightId, report);
      },
      close: (request: CloseFlightRequest) => {
        if (this.flightId) recorder.closeFlight(this.flightId, request);
      },
    };
    return new FlightSession(this.parts.session, output);
  }
}
