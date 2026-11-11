import type { FlightScript } from "./flight-script.ts";
import type { Scenario } from "./scenario.ts";

const has = (scenario: Scenario, d: Scenario["disturbances"][number]) =>
  scenario.disturbances.includes(d);

/** Boarding, pushback with engine start, taxi out. */
export function departureGround(script: FlightScript): void {
  script.run(60);
  script.run(90, (s, second) => {
    s.parkingBrake = false;
    s.pushback = true;
    s.gs = 2;
    if (second >= 30) s.enginesRunning = true;
  });
  script.run(300, (s) => {
    s.pushback = false;
    s.gs = 15;
  });
}

/** Take-off roll and lift-off; optionally a rejected take-off first. */
export function takeoff(script: FlightScript, scenario: Scenario): void {
  if (has(scenario, "rejectedTakeoff")) {
    script.until(
      (s) => s.gs >= 80,
      (s) => (s.gs += 4),
    );
    script.until(
      (s) => s.gs <= 10,
      (s) => (s.gs -= 4),
    );
    script.run(60, (s) => (s.gs = 15));
  }
  script.until(
    (s) => s.gs >= 160,
    (s) => (s.gs += 4),
  );
  script.run(1, (s) => {
    s.onGround = false;
    s.vs = 2500;
  });
}

/** Landing roll (optionally with a bounce), taxi in, parking and shutdown. */
export function arrivalGround(script: FlightScript, scenario: Scenario): void {
  script.run(1, (s) => {
    s.onGround = true;
    s.vs = 0;
  });
  if (has(scenario, "bounce")) {
    script.run(2, (s) => {
      s.onGround = false;
      s.altAgl = 5;
    });
    script.run(1, (s) => (s.onGround = true));
  }
  script.until(
    (s) => s.gs <= 20,
    (s) => (s.gs -= 3),
  );
  script.run(200, (s) => (s.gs = 12));
  script.run(20, (s) => {
    s.gs = 0;
    s.parkingBrake = true;
    s.enginesRunning = false;
  });
}
