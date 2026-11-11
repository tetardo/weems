import type { FlightScript } from "./flight-script.ts";
import { legsNm } from "./navigation/navigator.ts";
import { circuitLegs, enrouteLegs } from "./navigation/route-plan.ts";
import {
  cruiseCeilingFt,
  flareVs,
  mustLevelOff,
  pathAltitudeFt,
  pathDistanceNm,
  pathVs,
} from "./navigation/vertical-profile.ts";
import type { AircraftState } from "./sample-factory.ts";
import type { Scenario } from "./scenario.ts";

const has = (scenario: Scenario, d: Scenario["disturbances"][number]) =>
  scenario.disturbances.includes(d);

/** Longest flight the generator plays, against endless loops. */
const MAX_FLIGHT_S = 6 * 3600;
/** Margin kept before the top of descent by the in-cruise disturbances. */
const MARGIN_NM = 10;
/** Level flight before any disturbance, so that CRUISE is confirmed first (60 s). */
const SETTLE_S = 70;

/** Ground speed one knot per second closer to `target`. */
const toward = (gs: number, target: number) => gs + Math.max(-1, Math.min(1, target - gs));

/** Climb on the runway axis, turn toward the arrival, level at the highest fitting cruise level. */
export function climb(script: FlightScript, scenario: Scenario): void {
  const legs = enrouteLegs(script.choices.departureRunway, script.choices.arrivalRunway);
  script.follow(legs);
  const ceiling = cruiseCeilingFt(
    scenario.cruiseAltFt,
    legsNm(script.state, legs),
    scenario.departure.elevationFt,
    scenario.arrival.elevationFt,
  );
  script.run(10, (s) => (s.vs = 2500));
  const levelOffNow = (s: AircraftState) =>
    mustLevelOff(s.altMsl, script.remainingNm, s.gs, scenario.arrival.elevationFt);
  script.until(
    (s) => s.altMsl >= ceiling || levelOffNow(s),
    (s) => {
      s.gearDown = false;
      s.vs = 2500;
      s.gs = Math.min(scenario.cruiseGs, s.gs + 2);
    },
  );
  script.run(1, (s) => (s.vs = 0));
}

/** Seconds of 4× time acceleration that still leave room before the top of descent. */
function accelerationSeconds(script: FlightScript, topOfDescentNm: number): number {
  const nmPerSecond = (script.state.gs * 4) / 3600;
  const room = script.remainingNm - topOfDescentNm - MARGIN_NM;
  return Math.max(2, Math.min(300, Math.floor(room / nmPerSecond)));
}

/** In-cruise disturbances; returns false if the flight ended (crash). */
function cruiseDisturbances(script: FlightScript, scenario: Scenario, todNm: number): boolean {
  if (has(scenario, "pause")) script.run(120, (s, i) => (s.paused = i < 119));
  if (has(scenario, "timeAcceleration")) {
    const seconds = accelerationSeconds(script, todNm);
    script.run(seconds, (s, i) => (s.simRate = i < seconds - 1 ? 4 : 1));
  }
  if (has(scenario, "slew")) script.run(20, (s, i) => (s.slew = i < 19));
  if (has(scenario, "teleport")) {
    script.event("positionChanged");
    script.jump(Math.max(0, Math.min(20, script.remainingNm - todNm - MARGIN_NM)));
  }
  if (has(scenario, "crash")) {
    script.event("crashed");
    return false;
  }
  return true;
}

/** Level cruise to the top of descent, with disturbances half-way; false if it ended (crash). */
export function cruise(script: FlightScript, scenario: Scenario): boolean {
  const todNm = pathDistanceNm(script.state.altMsl, scenario.arrival.elevationFt);
  const halfWay = (script.remainingNm + todNm) / 2;
  const level = (s: AircraftState) => (s.vs = 0);
  script.run(SETTLE_S, level);
  script.until(() => script.remainingNm <= halfWay, level, MAX_FLIGHT_S);
  if (!cruiseDisturbances(script, scenario, todNm)) return false;
  script.until(() => script.remainingNm <= todNm, level, MAX_FLIGHT_S);
  return true;
}

/** Speed for the distance left: cruise, then slowed down, then approach speed on the final. */
function targetSpeed(remainingNm: number, scenario: Scenario): number {
  if (remainingNm > 60) return scenario.cruiseGs;
  if (remainingNm > 12) return Math.min(scenario.cruiseGs, scenario.approachGs + 60);
  return scenario.approachGs;
}

/** Follows the 3° path down to `stopHeightFt` (0: touchdown, after the flare). */
function descendTo(script: FlightScript, scenario: Scenario, stopHeightFt: number): void {
  const elevation = scenario.arrival.elevationFt;
  script.until(
    (s) => s.altAgl <= stopHeightFt,
    (s) => {
      const remaining = script.remainingNm;
      s.gs = toward(s.gs, targetSpeed(remaining, scenario));
      const vs = pathVs(s.altMsl, pathAltitudeFt(remaining, elevation), s.gs, s.vs);
      s.vs = flareVs(s.altAgl, vs, script.choices.touchdownVs);
      if (s.altAgl < 2000) s.gearDown = true;
    },
    MAX_FLIGHT_S,
  );
}

/** Climbs into the circuit at `heightFt` above the runway after a go-around or touch-and-go. */
function climbIntoCircuit(script: FlightScript, heightFt: number, vs: number): void {
  script.follow(circuitLegs(script.choices.arrivalRunway));
  script.until(
    (s) => s.altAgl >= heightFt,
    (s) => (s.vs = vs),
  );
}

/** Descent on the 3° path, approach and final down to the runway, with go-around or touch-and-go. */
export function descentAndApproach(script: FlightScript, scenario: Scenario): void {
  if (has(scenario, "goAround")) {
    descendTo(script, scenario, 300);
    climbIntoCircuit(script, 2000, 1500);
  }
  if (has(scenario, "touchAndGo")) {
    descendTo(script, scenario, 0);
    script.run(5, (s) => {
      s.onGround = true;
      s.vs = 0;
    });
    script.run(1, (s) => (s.onGround = false));
    climbIntoCircuit(script, 1500, 1000);
  }
  descendTo(script, scenario, 0);
}
