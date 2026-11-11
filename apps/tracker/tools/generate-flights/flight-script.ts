import type { SimEventType } from "@weems/contrats";
import type { ReplayRecord } from "../../src/connectors/replay/replay-format.ts";
import { distanceNm } from "../../src/core/recovery.ts";
import { seededRandom } from "./random.ts";
import { type AircraftState, toSample } from "./sample-factory.ts";
import type { Scenario } from "./scenario.ts";

const STEP_MS = 1000;

function headingBetween(from: Scenario["departure"], to: Scenario["arrival"]): number {
  const deg = (Math.atan2(to.lon - from.lon, to.lat - from.lat) * 180) / Math.PI;
  return Math.round(((deg % 360) + 360) % 360);
}

/**
 * Simple kinematics, one sample per real second: enough to test phases and the chain,
 * not a flight model. Position moves from departure to arrival as distance is flown.
 */
export class FlightScript {
  readonly state: AircraftState;
  readonly records: ReplayRecord[] = [];
  private flownNm = 0;
  private readonly totalNm: number;
  private readonly random: () => number;
  private readonly scenario: Scenario;

  constructor(scenario: Scenario) {
    this.scenario = scenario;
    this.random = seededRandom(scenario.seed);
    const { departure, arrival } = scenario;
    this.totalNm = distanceNm(departure.lat, departure.lon, arrival.lat, arrival.lon);
    this.state = {
      t: 0,
      ...departure,
      altAgl: 0,
      gs: 0,
      vs: 0,
      heading: headingBetween(departure, arrival),
      onGround: true,
      enginesRunning: false,
      pushback: false,
      parkingBrake: true,
      gearDown: true,
      paused: false,
      simRate: 1,
      slew: false,
    };
    this.records.push({ type: "aircraft", t: 0, data: scenario.aircraft });
  }

  get remainingNm(): number {
    return Math.max(0, this.totalNm - this.flownNm);
  }

  /** Plays `seconds` of real time, calling `change` before each step. */
  run(seconds: number, change: (s: AircraftState, second: number) => void = () => {}): void {
    for (let second = 0; second < seconds; second++) {
      change(this.state, second);
      this.step();
    }
  }

  /** Plays until `done` is true (at most `maxSeconds`, against endless loops). */
  until(
    done: (s: AircraftState) => boolean,
    change: (s: AircraftState) => void,
    maxSeconds = 7200,
  ): void {
    for (let second = 0; second < maxSeconds && !done(this.state); second++) {
      change(this.state);
      this.step();
    }
  }

  event(type: SimEventType): void {
    this.records.push({ type: "event", t: this.state.t, data: { t: this.state.t, type } });
  }

  /** Teleport: jumps `nm` further along the route. */
  jump(nm: number): void {
    this.flownNm += nm;
    this.updatePosition();
  }

  private step(): void {
    const s = this.state;
    s.t += STEP_MS;
    if (!s.paused && !s.slew) {
      const simSeconds = (STEP_MS / 1000) * s.simRate;
      this.flownNm += (s.gs * simSeconds) / 3600;
      s.altAgl = s.onGround ? 0 : Math.max(0, s.altAgl + (s.vs * simSeconds) / 60);
      this.updatePosition();
    }
    this.records.push({ type: "sample", t: s.t, data: this.noisy() });
  }

  private updatePosition(): void {
    const { departure, arrival } = this.scenario;
    const fraction = this.totalNm === 0 ? 1 : Math.min(1, this.flownNm / this.totalNm);
    this.state.lat = departure.lat + (arrival.lat - departure.lat) * fraction;
    this.state.lon = departure.lon + (arrival.lon - departure.lon) * fraction;
  }

  /** Light noise on speeds, like a real recording; the state itself stays exact. */
  private noisy() {
    const sample = toSample(this.state, this.scenario.aircraft.engineCount);
    if (!sample.onGround) sample.vs += (this.random() - 0.5) * 40;
    if (sample.gs > 1) sample.gs = Math.max(0, sample.gs + (this.random() - 0.5));
    return sample;
  }
}
