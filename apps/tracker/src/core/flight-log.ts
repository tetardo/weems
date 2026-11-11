import type { FlightEvent, FlightEventType } from "@weems/contrats";

/**
 * Numbers and dates the events of one flight. `seq` starts at 1 and never repeats,
 * which makes re-sends harmless on the API side. Dates come from sample time `t`
 * shifted by `epochUtcMs`, so a replay keeps its own timeline.
 */
export class FlightLog {
  private seq = 0;
  private readonly epochUtcMs: number;
  private readonly emit: (event: FlightEvent) => void;

  /** `lastSeq`: last number already used, when a flight resumes after a crash. */
  constructor(epochUtcMs: number, emit: (event: FlightEvent) => void, lastSeq = 0) {
    this.epochUtcMs = epochUtcMs;
    this.seq = lastSeq;
    this.emit = emit;
  }

  /** UTC ISO date of sample time `t`, with milliseconds. */
  at(t: number): string {
    return new Date(this.epochUtcMs + t).toISOString();
  }

  record(type: FlightEventType, t: number, context: Record<string, unknown> = {}): void {
    this.seq += 1;
    this.emit({ seq: this.seq, at: this.at(t), type, context });
  }
}
