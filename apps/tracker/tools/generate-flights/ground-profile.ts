import { angleDiffDeg, distanceBetweenNm as away, type LatLon } from "@weems/contrats";
import type { RunwayEnd } from "./airports/airport-data.ts";
import type { FlightScript } from "./flight-script.ts";
import { runwayAxisLeg } from "./navigation/route-plan.ts";
import { DEFAULT_CLIMB_FPM, DEFAULT_ROTATE_GS, type Scenario } from "./scenario.ts";

const has = (scenario: Scenario, d: Scenario["disturbances"][number]) =>
  scenario.disturbances.includes(d);

/** Close enough to a taxi target (about 50 m). */
const ARRIVED_NM = 0.03;
const SLOW_DOWN_NM = 0.2;

/** Taxi straight to `target` (no taxiway data), slower when close. */
function taxiTo(script: FlightScript, target: LatLon, gs: number): void {
  script.follow([{ fix: target }]);
  script.until(
    (s) => away(s, target) < ARRIVED_NM,
    (s) => {
      s.pushback = false;
      s.gs = away(s, target) < SLOW_DOWN_NM ? Math.min(8, gs) : gs;
    },
    1800,
  );
}

/** Taxi to the runway threshold and line up on its axis. */
function taxiToRunway(script: FlightScript, runway: RunwayEnd): void {
  taxiTo(script, runway, 15);
  script.follow([runwayAxisLeg(runway)]);
  script.until(
    (s) => Math.abs(angleDiffDeg(s.heading, runway.headingDeg)) < 3,
    (s) => (s.gs = 4),
    120,
  );
}

/** Contact: the touchdown sample keeps the sink rate of the flare, then the aircraft rolls. */
export function touchDown(script: FlightScript, rollSeconds: number): void {
  script.run(1, (s) => (s.onGround = true));
  script.run(rollSeconds, (s) => {
    s.onGround = true;
    s.vs = 0;
  });
}

/** Boarding, pushback with engine start, taxi out to the departure runway. */
export function departureGround(script: FlightScript): void {
  script.run(60);
  script.run(90, (s, second) => {
    s.parkingBrake = false;
    s.pushback = true;
    s.gs = 2;
    if (second >= 30) s.enginesRunning = true;
  });
  taxiToRunway(script, script.choices.departureRunway);
}

/** Take-off roll on the runway axis and lift-off; optionally a rejected take-off first. */
export function takeoff(script: FlightScript, scenario: Scenario): void {
  const runway = script.choices.departureRunway;
  if (has(scenario, "rejectedTakeoff")) {
    script.until(
      (s) => s.gs >= 80,
      (s) => (s.gs += 4),
    );
    script.until(
      (s) => s.gs <= 10,
      (s) => (s.gs -= 4),
    );
    taxiToRunway(script, runway);
  }
  const rotateGs = scenario.rotateGs ?? DEFAULT_ROTATE_GS;
  script.until(
    (s) => s.gs >= rotateGs,
    (s) => (s.gs += 4),
  );
  script.run(1, (s) => {
    s.onGround = false;
    s.vs = scenario.climbFpm ?? DEFAULT_CLIMB_FPM;
  });
}

/** Landing roll on the runway (optionally with a bounce), taxi in, parking and shutdown. */
export function arrivalGround(script: FlightScript, scenario: Scenario): void {
  touchDown(script, 1);
  if (has(scenario, "bounce")) {
    script.run(2, (s, second) => {
      s.onGround = false;
      s.vs = second === 0 ? 300 : -300;
    });
    touchDown(script, 1);
  }
  script.until(
    (s) => s.gs <= 20,
    (s) => (s.gs -= 3),
  );
  taxiTo(script, scenario.arrival, 12);
  script.run(20, (s) => {
    s.gs = 0;
    s.parkingBrake = true;
    s.enginesRunning = false;
  });
}
