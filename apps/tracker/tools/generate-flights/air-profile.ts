import type { FlightScript } from "./flight-script.ts";
import type { Scenario } from "./scenario.ts";

const has = (scenario: Scenario, d: Scenario["disturbances"][number]) =>
  scenario.disturbances.includes(d);

/** Climb to cruise level, gear up, speed up. */
export function climb(script: FlightScript, scenario: Scenario): void {
  script.run(10, (s) => (s.vs = 2500));
  script.until(
    (s) => s.altAgl >= scenario.cruiseAltFt,
    (s) => {
      s.gearDown = false;
      s.vs = 2500;
      s.gs = Math.min(scenario.cruiseGs, s.gs + 2);
    },
  );
  script.run(1, (s) => (s.vs = 0));
}

/** Cruise, with in-flight disturbances; returns false if the flight ended (crash). */
export function cruise(script: FlightScript, scenario: Scenario): boolean {
  const descentNm = (scenario.cruiseAltFt / 2000) * (300 / 60);
  const seconds = Math.max(300, ((script.remainingNm - descentNm) / scenario.cruiseGs) * 3600);
  script.run(Math.round(seconds / 2), (s) => (s.vs = 0));
  if (has(scenario, "pause")) script.run(120, (s, i) => (s.paused = i < 119));
  if (has(scenario, "timeAcceleration")) script.run(300, (s, i) => (s.simRate = i < 299 ? 4 : 1));
  if (has(scenario, "slew")) script.run(20, (s, i) => (s.slew = i < 19));
  if (has(scenario, "teleport")) {
    script.event("positionChanged");
    script.jump(20);
  }
  if (has(scenario, "crash")) {
    script.event("crashed");
    return false;
  }
  script.run(Math.round(seconds / 2), (s) => (s.vs = 0));
  return true;
}

/** Descent, approach and final down to the runway. */
export function descentAndApproach(script: FlightScript, scenario: Scenario): void {
  script.until(
    (s) => s.altAgl <= 3000,
    (s) => {
      s.vs = -2000;
      s.gs = Math.max(scenario.approachGs + 60, s.gs - 1);
    },
  );
  script.until(
    (s) => s.altAgl <= 1500,
    (s) => {
      s.vs = -1000;
      s.gs = Math.max(scenario.approachGs, s.gs - 1);
      if (s.altAgl < 2000) s.gearDown = true;
    },
  );
  if (has(scenario, "goAround")) goAround(script);
  if (has(scenario, "touchAndGo")) touchAndGo(script);
  finalDescent(script);
}

function finalDescent(script: FlightScript): void {
  script.until(
    (s) => s.altAgl <= 0,
    (s) => {
      s.gearDown = true;
      s.vs = -700;
    },
  );
}

/** Go-around at 300 ft, climb to 2 000 ft, level, then a new approach. */
function goAround(script: FlightScript): void {
  script.until(
    (s) => s.altAgl <= 300,
    (s) => (s.vs = -700),
  );
  script.until(
    (s) => s.altAgl >= 2000,
    (s) => (s.vs = 1500),
  );
  script.run(90, (s) => (s.vs = 0));
}

/** Touch-and-go: touches, rolls 5 s, climbs to 1 500 ft, levels, then a new approach. */
function touchAndGo(script: FlightScript): void {
  finalDescent(script);
  script.run(5, (s) => {
    s.onGround = true;
    s.vs = 0;
  });
  script.run(1, (s) => {
    s.onGround = false;
    s.vs = 1000;
  });
  script.until(
    (s) => s.altAgl >= 1500,
    (s) => (s.vs = 1000),
  );
  script.run(90, (s) => (s.vs = 0));
}
