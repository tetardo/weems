import type {
  AircraftInfo,
  CloseFlightRequest,
  CloseReason,
  FlightEvent,
  OpenFlightRequest,
  PositionReport,
  Sample,
  SimEvent,
} from "@weems/contrats";
import type { Clock } from "./clock.ts";
import { FlightLog } from "./flight-log.ts";
import type { PhaseParams } from "./phases/params.ts";
import { PhaseMachine, type PhaseOutput } from "./phases/phase-machine.ts";
import type { SavedFlight } from "./recovery.ts";
import { positionIntervalMs } from "./position-cadence.ts";
import { SimStateWatcher } from "./sim-state-watcher.ts";

/** Where a session sends what it produces: the recorder, then the sender. */
export interface SessionOutput {
  open(request: OpenFlightRequest): void;
  event(event: FlightEvent): void;
  position(report: PositionReport): void;
  close(request: CloseFlightRequest): void;
}

/** Airports known before the flight (SimBrief from T2). */
interface FlightPlan {
  departureIcao: string;
  arrivalIcao: string;
}

export interface SessionOptions {
  callsign: string;
  /** Absent: departure and arrival are sent as unknown. */
  flightPlan?: FlightPlan;
  trackerVersion: string;
  clock: Clock;
  /** New flight id (UUID v7) for the given UTC time. */
  newFlightId: (nowUtcMs: number) => string;
  params: PhaseParams;
}

/** Waiting: no aircraft. Armed: aircraft on the ground, engines off. Flying: recording. */
export type SessionState = "waiting" | "armed" | "flying" | "closed";

const engineRunning = (s: Sample) => s.engines.some((e) => e.running);

/**
 * One flight, from aircraft loading to closing (architecture interne, part 2).
 * Pure core: no I/O, time comes from samples and the injected clock.
 */
export class FlightSession {
  private stateValue: SessionState = "waiting";
  private aircraft: AircraftInfo | null = null;
  private log: FlightLog | null = null;
  private lastSample: Sample | null = null;
  private lastPositionT: number | null = null;
  private positionSeq = 0;
  private readonly machine: PhaseMachine;
  private readonly watcher = new SimStateWatcher();
  private readonly options: SessionOptions;
  private readonly output: SessionOutput;

  constructor(options: SessionOptions, output: SessionOutput) {
    this.options = options;
    this.output = output;
    this.machine = new PhaseMachine(options.params);
  }

  get state(): SessionState {
    return this.stateValue;
  }

  /** UTC time of a sample of the current flight (null before opening). */
  utcAt(t: number): string | null {
    return this.log?.at(t) ?? null;
  }

  setAircraft(aircraft: AircraftInfo): void {
    if (
      this.stateValue === "flying" &&
      this.aircraft?.title !== aircraft.title &&
      this.lastSample
    ) {
      this.log?.record("aircraftChanged", this.lastSample.t, { title: aircraft.title });
      this.close(this.lastSample.t, "aircraftChanged");
      return;
    }
    this.aircraft = aircraft;
  }

  handleSample(sample: Sample): void {
    this.lastSample = sample;
    if (this.stateValue === "waiting" && this.aircraft) {
      this.stateValue = "armed";
    }
    // EF-07: the flight starts at the first engine start or pushback, or when loaded in the air.
    const starts = engineRunning(sample) || sample.pushback === true || !sample.onGround;
    if (this.stateValue === "armed" && starts) this.open(sample);
    if (this.stateValue === "flying") this.record(sample);
  }

  handleSimEvent(event: SimEvent): void {
    if (this.stateValue !== "flying") return;
    if (event.type === "crashed") {
      this.log?.record("crashed", event.t);
      this.close(event.t, "crash");
    } else if (event.type === "positionChanged") {
      this.log?.record("positionChanged", event.t);
    } else if (event.type === "connectionLost" || event.type === "connectionRestored") {
      this.log?.record(event.type, event.t);
    }
  }

  /**
   * Continues a flight interrupted by a crash (ENF-02), once `decideRecovery` said so:
   * same flight id, numbering continues, a "resumed" event marks the gap.
   */
  resume(saved: SavedFlight, sample: Sample): void {
    if (!this.aircraft || this.stateValue === "flying" || this.stateValue === "closed") return;
    const nowUtcMs = this.options.clock.nowUtcMs();
    this.log = new FlightLog(
      nowUtcMs - sample.t,
      (event) => this.output.event(event),
      saved.lastSeq,
    );
    this.positionSeq = saved.lastPositionSeq;
    if (saved.lastPhase) this.machine.resumeAt(saved.lastPhase);
    this.stateValue = "flying";
    this.log.record("resumed", sample.t, { lastAt: saved.lastAt });
    this.lastSample = sample;
    this.record(sample);
  }

  /** Manual close by the pilot (EF-12). */
  closeManually(): void {
    if (this.stateValue === "flying" && this.lastSample) this.close(this.lastSample.t, "manual");
  }

  private open(sample: Sample): void {
    const aircraft = this.aircraft;
    if (!aircraft) return;
    const nowUtcMs = this.options.clock.nowUtcMs();
    this.log = new FlightLog(nowUtcMs - sample.t, (event) => this.output.event(event));
    this.stateValue = "flying";
    this.output.open({
      flightId: this.options.newFlightId(nowUtcMs),
      callsign: this.options.callsign,
      aircraft,
      departureIcao: this.options.flightPlan?.departureIcao ?? null,
      plannedArrivalIcao: this.options.flightPlan?.arrivalIcao ?? null,
      openedAt: this.log.at(sample.t),
      trackerVersion: this.options.trackerVersion,
    });
  }

  private record(sample: Sample): void {
    const log = this.log;
    if (!log) return;
    this.watcher.watch(sample, log);
    for (const output of this.machine.feed(sample)) this.logPhaseOutput(output, log);
    this.sendPosition(sample, log);
    if (this.machine.phase === "ARRIVED") this.close(sample.t, "normal");
  }

  private logPhaseOutput(output: PhaseOutput, log: FlightLog): void {
    if (output.kind === "phaseChanged") {
      const context = {
        from: output.from,
        to: output.to,
        ...(output.airStart && { airStart: true }),
      };
      log.record("phaseChanged", output.t, context);
    } else if (output.kind === "touchdown") {
      log.record("touchdown", output.t, { vs: output.vs });
    } else {
      log.record(output.kind, output.t);
    }
  }

  private sendPosition(sample: Sample, log: FlightLog): void {
    const phase = this.machine.phase;
    const interval = phase === null ? null : positionIntervalMs(phase);
    if (phase === null || interval === null) return;
    if (this.lastPositionT !== null && sample.t - this.lastPositionT < interval) return;
    this.lastPositionT = sample.t;
    this.positionSeq += 1;
    this.output.position({
      seq: this.positionSeq,
      at: log.at(sample.t),
      lat: sample.lat,
      lon: sample.lon,
      altMsl: sample.altMsl,
      gs: sample.gs,
      heading: sample.heading,
      vs: sample.vs,
      phase,
      onGround: sample.onGround,
    });
  }

  private close(t: number, reason: CloseReason): void {
    const log = this.log;
    if (this.stateValue !== "flying" || !log) return;
    const arrived = this.machine.close(t);
    if (arrived) this.logPhaseOutput(arrived, log);
    this.stateValue = "closed";
    this.output.close({ closedAt: log.at(t), reason });
  }
}
