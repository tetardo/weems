import { readFile } from "node:fs/promises";
import type { SimConnector } from "../../core/connector.ts";
import { ConnectorListeners } from "../connector-listeners.ts";
import { parseReplay, type Replay, type ReplayRecord } from "./replay-format.ts";

/** "instant": everything at once (tests); a number: speed factor (1 = real time, 10 = ×10). */
export type ReplaySpeed = "instant" | number;

/**
 * Plays a recorded or synthetic flight through the connector interface,
 * so the whole tracker runs on the Mac without the simulator (J1 and all tests).
 */
export class ReplayConnector extends ConnectorListeners implements SimConnector {
  readonly name = "replay";
  private readonly replay: Replay;
  private readonly speed: ReplaySpeed;
  private stopped = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(replay: Replay, speed: ReplaySpeed = "instant") {
    super();
    this.replay = replay;
    this.speed = speed;
  }

  static async fromFile(path: string, speed?: ReplaySpeed): Promise<ReplayConnector> {
    return new ReplayConnector(parseReplay(await readFile(path, "utf8")), speed);
  }

  /** Resolves when the whole replay has been played (or stopped). */
  async start(): Promise<void> {
    this.stopped = false;
    this.emitStatus("connected");
    if (this.speed === "instant") this.replay.records.forEach((r) => this.dispatch(r));
    else await this.playTimed(this.speed);
    this.emitStatus("disconnected");
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
  }

  /** A replay has a fixed rate: the requested rate is ignored. */
  setReadRate(_rate: "high" | "normal"): void {}

  private async playTimed(factor: number): Promise<void> {
    let previousT = this.replay.records[0]?.t ?? 0;
    for (const record of this.replay.records) {
      if (this.stopped) return;
      await new Promise<void>((resolve) => {
        this.timer = setTimeout(resolve, (record.t - previousT) / factor);
      });
      previousT = record.t;
      this.dispatch(record);
    }
  }

  private dispatch(record: ReplayRecord): void {
    if (record.type === "aircraft") this.emitAircraft(record.data);
    else if (record.type === "sample") this.emitSample(record.data);
    else this.emitEvent(record.data);
  }
}
