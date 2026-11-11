import type { Disturbance } from "./scenario.ts";

const DEPARTURE = "BOARDING PUSHBACK TAXI_OUT TAKEOFF CLIMB CRUISE";
const ARRIVAL = "DESCENT APPROACH FINAL *touchdown LANDING";
const END = "TAXI_IN ARRIVED";

/**
 * Phases and notable events a generated flight must produce, in order
 * ("*" marks an event). Used to check the core and the J1 simulation (criterion 5).
 * Supports one disturbance at a time, plus in-cruise ones that do not change phases.
 */
export function expectedTrace(disturbances: readonly Disturbance[]): string {
  const has = (d: Disturbance) => disturbances.includes(d);
  if (has("crash")) return `${DEPARTURE} *crashed ARRIVED`;
  const departure = has("rejectedTakeoff")
    ? "BOARDING PUSHBACK TAXI_OUT TAKEOFF *rejectedTakeoff TAXI_OUT TAKEOFF CLIMB CRUISE"
    : DEPARTURE;
  const cruise = [
    has("pause") ? "*paused *unpaused" : "",
    has("timeAcceleration") ? "*simRateChanged *simRateChanged" : "",
    has("slew") ? "*slew *slew" : "",
    has("teleport") ? "*positionChanged" : "",
  ].filter(Boolean);
  let arrival = ARRIVAL;
  if (has("goAround")) arrival = `DESCENT APPROACH FINAL *goAround CLIMB CRUISE ${ARRIVAL}`;
  if (has("touchAndGo")) arrival = `${ARRIVAL} *touchAndGo CLIMB CRUISE ${ARRIVAL}`;
  if (has("bounce")) arrival = `${ARRIVAL} *bounce`;
  return [departure, ...cruise, arrival, END].join(" ");
}
