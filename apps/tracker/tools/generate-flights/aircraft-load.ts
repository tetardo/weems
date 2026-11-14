import { type AircraftInfo, distanceBetweenNm } from "@weems/contrats";
import type { Scenario } from "./scenario.ts";

/** Fuel and payload of a synthetic flight, drawn once from its seed; null without weights. */
export interface Loading {
  fuelKg: number;
  payloadKg: number;
}

/** Cruise burn: about 3 % of the maximum weight per hour (A320 ≈ 2.4 t/h, C172 ≈ 33 kg/h). */
const CRUISE_BURN_SHARE_PER_HOUR = 0.03;
/** Burn compared with the cruise: taxi, climb, descent. */
const TAXI_FACTOR = 0.2;
const CLIMB_FACTOR = 1.4;
const DESCENT_FACTOR = 0.4;
const CLIMBING_FPM = 300;
/** Fuel for the trip, plus 45 minutes, and some extra for taxi and the approach. */
const RESERVE_HOURS = 0.75;
const EXTRA_HOURS = 0.25;

const cruiseBurnKgPerHour = (maxGrossWeightKg: number) =>
  maxGrossWeightKg * CRUISE_BURN_SHARE_PER_HOUR;

export function drawLoading(scenario: Scenario, random: () => number): Loading | null {
  const { emptyWeightKg, maxGrossWeightKg } = scenario.aircraft;
  if (emptyWeightKg === null || maxGrossWeightKg === null) return null;
  const hours = distanceBetweenNm(scenario.departure, scenario.arrival) / scenario.cruiseGs;
  const useful = maxGrossWeightKg - emptyWeightKg;
  const wanted = cruiseBurnKgPerHour(maxGrossWeightKg) * (hours + RESERVE_HOURS + EXTRA_HOURS);
  const fuelKg = Math.round(Math.min(wanted, useful * 0.6));
  // Passengers and freight: half to all of what the fuel leaves.
  const payloadKg = Math.round((useful - fuelKg) * (0.5 + random() * 0.5));
  return { fuelKg, payloadKg };
}

/** Fuel burnt per second of simulated time, kg: nothing with the engines stopped. */
export function burnKgPerS(
  aircraft: AircraftInfo,
  state: { enginesRunning: boolean; onGround: boolean; vs: number },
): number {
  if (!state.enginesRunning || aircraft.maxGrossWeightKg === null) return 0;
  const factor = state.onGround
    ? TAXI_FACTOR
    : state.vs > CLIMBING_FPM
      ? CLIMB_FACTOR
      : state.vs < -CLIMBING_FPM
        ? DESCENT_FACTOR
        : 1;
  return (cruiseBurnKgPerHour(aircraft.maxGrossWeightKg) * factor) / 3600;
}
