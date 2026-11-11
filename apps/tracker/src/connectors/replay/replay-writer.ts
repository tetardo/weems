import type { SimConnector } from "../../core/connector.ts";
import type { ReplayRecord } from "./replay-format.ts";

/**
 * Writes everything a connector emits as a replay file (spec J2: every real flight is kept
 * to be replayed on the Mac). `write` receives one JSON line at a time.
 * Times are shifted so that the recording starts at t = 0.
 */
export class ReplayWriter {
  private readonly write: (line: string) => void;
  private origin: number | null = null;
  private lastT = 0;

  constructor(write: (line: string) => void) {
    this.write = write;
  }

  attach(connector: SimConnector): void {
    this.line({ format: "weems-replay", version: 1, source: "msfs" });
    connector.onAircraft((data) => this.record({ type: "aircraft", t: this.lastT, data }));
    connector.onSample((data) => {
      const t = this.shift(data.t);
      this.record({ type: "sample", t, data: { ...data, t } });
    });
    connector.onEvent((data) => {
      const t = this.shift(data.t);
      this.record({ type: "event", t, data: { ...data, t } });
    });
  }

  private shift(t: number): number {
    this.origin ??= t;
    this.lastT = Math.max(this.lastT, t - this.origin);
    return this.lastT;
  }

  private record(record: ReplayRecord): void {
    this.line(record);
  }

  private line(value: unknown): void {
    this.write(`${JSON.stringify(value)}\n`);
  }
}
