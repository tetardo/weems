import {
  destinationPoint,
  distanceBetweenNm,
  type LatLon,
  type SimEventType,
} from "@weems/contrats";
import type { ReplayRecord } from "../../src/connectors/replay/replay-format.ts";
import type { RunwayEnd } from "./airports/airport-data.ts";
import { type Leg, Navigator } from "./navigation/navigator.ts";
import { pickRunway } from "./navigation/route-plan.ts";
import { turnRadiusNm, turnToward } from "./navigation/steering.ts";
import { drawTouchdownVs } from "./navigation/vertical-profile.ts";
import { seededRandom } from "./random.ts";
import { type AircraftState, toSample } from "./sample-factory.ts";
import type { Scenario } from "./scenario.ts";

const STEP_MS = 1000;
/** Separate stream for the flight's choices, so that they do not depend on the number of samples. */
const PLAN_SEED_SALT = 0x5eed;

/** What is drawn once per flight from its seed. */
export interface FlightChoices {
  departureRunway: RunwayEnd;
  arrivalRunway: RunwayEnd;
  /** ft/min, negative. */
  touchdownVs: number;
}

function drawChoices(scenario: Scenario, random: () => number) {
  const choices: FlightChoices = {
    departureRunway: pickRunway(scenario.departure, random),
    arrivalRunway: pickRunway(scenario.arrival, random),
    touchdownVs: drawTouchdownVs(random),
  };
  return { choices, parkingHeading: Math.floor(random() * 360) };
}

/**
 * Simple kinematics, one sample per real second: enough to test phases and the chain and to
 * draw a plausible track, not a flight model. The aircraft moves along its heading at its
 * ground speed; a navigator turns it toward the legs it is given.
 */
export class FlightScript {
  readonly state: AircraftState;
  readonly records: ReplayRecord[] = [];
  readonly choices: FlightChoices;
  private readonly navigator = new Navigator();
  private readonly random: () => number;
  private readonly scenario: Scenario;

  constructor(scenario: Scenario) {
    this.scenario = scenario;
    this.random = seededRandom(scenario.seed);
    const drawn = drawChoices(scenario, seededRandom(scenario.seed ^ PLAN_SEED_SALT));
    this.choices = drawn.choices;
    const { lat, lon } = scenario.departure;
    this.state = {
      t: 0,
      lat,
      lon,
      altMsl: drawn.choices.departureRunway.elevationFt,
      altAgl: 0,
      gs: 0,
      vs: 0,
      heading: drawn.parkingHeading,
      bank: 0,
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

  /** From now on, steer along `legs`. */
  follow(legs: readonly Leg[]): void {
    this.navigator.follow(legs);
  }

  /** Distance left along the legs being followed. */
  get remainingNm(): number {
    return this.navigator.remainingNm(this.state);
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

  /** Teleport: jumps `nm` ahead on the current heading. */
  jump(nm: number): void {
    Object.assign(this.state, destinationPoint(this.state, this.state.heading, nm));
  }

  private step(): void {
    const s = this.state;
    s.t += STEP_MS;
    if (!s.paused && !s.slew) {
      const simSeconds = (STEP_MS / 1000) * s.simRate;
      this.steer(simSeconds);
      this.move(simSeconds);
    }
    this.records.push({ type: "sample", t: s.t, data: this.noisy() });
  }

  private steer(seconds: number): void {
    const s = this.state;
    const desired = this.navigator.desiredHeading(s, turnRadiusNm(s.gs, s.onGround));
    if (desired === null || s.gs < 1) {
      s.bank = 0;
      return;
    }
    Object.assign(s, turnToward(s, desired, seconds));
  }

  private move(seconds: number): void {
    const s = this.state;
    const direction = s.pushback ? s.heading + 180 : s.heading;
    Object.assign(s, destinationPoint(s, direction, (s.gs * seconds) / 3600));
    const ground = this.groundElevationFt(s);
    s.altMsl = s.onGround ? ground : Math.max(ground, s.altMsl + (s.vs * seconds) / 60);
    s.altAgl = s.altMsl - ground;
  }

  /** Terrain: from the departure to the arrival runway elevation, in proportion to the distances. */
  private groundElevationFt(at: LatLon): number {
    const fromDeparture = distanceBetweenNm(this.scenario.departure, at);
    const toArrival = distanceBetweenNm(at, this.scenario.arrival);
    const share = fromDeparture / Math.max(1e-9, fromDeparture + toArrival);
    const { departureRunway, arrivalRunway } = this.choices;
    return (
      departureRunway.elevationFt +
      (arrivalRunway.elevationFt - departureRunway.elevationFt) * share
    );
  }

  /** Light noise on speeds, like a real recording; the state itself stays exact. */
  private noisy() {
    const sample = toSample(this.state, this.scenario.aircraft.engineCount);
    if (!sample.onGround) sample.vs += (this.random() - 0.5) * 40;
    if (sample.gs > 1) sample.gs = Math.max(0, sample.gs + (this.random() - 0.5));
    return sample;
  }
}
