import type { AircraftInfo } from "@weems/contrats";

/** Pressurisation of a synthetic flight, drawn once from its seed. */
export interface Cabin {
  /** Pistons are not pressurised: the cabin is at the aircraft's altitude. */
  pressurized: boolean;
  /** Fastest cabin climb and descent, ft/min (positive numbers). */
  climbLimitFpm: number;
  descentLimitFpm: number;
}

/** Cabin altitude scheduled at about 22 % of the aircraft's, at most 8 000 ft (pressurised). */
const SCHEDULE_SHARE = 0.22;
const MAX_CABIN_ALT_FT = 8000;
/** A crew that lets the cabin climb or descend too fast, from time to time (marks to review). */
const ROUGH_SHARE = 0.1;
const SMOOTH = { climbLimitFpm: 450, descentLimitFpm: 280 };
const ROUGH = { climbLimitFpm: 800, descentLimitFpm: 600 };

export function drawCabin(aircraft: AircraftInfo, random: () => number): Cabin {
  const limits = random() < ROUGH_SHARE ? ROUGH : SMOOTH;
  return { pressurized: aircraft.engineType !== "piston", ...limits };
}

/**
 * Cabin altitude after `seconds`: toward the schedule (never below the terrain), no faster than
 * the cabin's limits. Unpressurised: the aircraft's altitude.
 */
export function nextCabinAlt(
  cabin: Cabin,
  current: number,
  aircraft: { altMsl: number; altAgl: number },
  seconds: number,
): number {
  if (!cabin.pressurized) return aircraft.altMsl;
  const ground = aircraft.altMsl - aircraft.altAgl;
  const target = Math.max(ground, Math.min(MAX_CABIN_ALT_FT, aircraft.altMsl * SCHEDULE_SHARE));
  const minutes = seconds / 60;
  const step = Math.max(
    -cabin.descentLimitFpm * minutes,
    Math.min(cabin.climbLimitFpm * minutes, target - current),
  );
  return current + step;
}
