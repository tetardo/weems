import { PilotRank } from "@weems/contrats";
import type { Disturbance } from "../generate-flights/scenario.ts";

/**
 * The hand of a fictitious pilot (fiche 019): 0 beginner to 1 expert. It spreads the touchdowns
 * (generator), makes bounces and go-arounds more or less frequent, and sometimes spoils a flight.
 * A pilot gets better with their flights.
 */

/** Skill on each of `count` flights of a hobby pilot: a level of their own, slowly improving. */
export function hobbySkills(count: number, random: () => number): number[] {
  const start = 0.15 + random() * 0.6;
  return Array.from({ length: count }, (_, i) => Math.min(0.95, start + (0.25 * i) / count));
}

/** Skill on each flight of a career: from beginner to the level of the rank reached. */
export function careerSkills(count: number, rank: PilotRank): number[] {
  const end = 0.25 + (0.7 * PilotRank.options.indexOf(rank)) / (PilotRank.options.length - 1);
  return Array.from(
    { length: count },
    (_, i) => 0.15 + ((end - 0.15) * i) / Math.max(1, count - 1),
  );
}

/**
 * Ways a flight goes wrong, all refused by the valid flight rule (flights/validity.ts):
 * crash, teleport or slew (moved), closed in the air (interrupted: no landing).
 */
export type Failure = "crash" | "teleport" | "slew" | "interrupted";

/** Chance that a flight goes wrong: about 5 % for an average pilot, 9 % for a beginner. */
const failureChance = (skill: number) => 0.01 + 0.08 * (1 - skill);

/** One failure, or null when the flight goes as planned. */
export function drawFailure(skill: number, random: () => number): Failure | null {
  if (random() >= failureChance(skill)) return null;
  const roll = random();
  if (roll < 0.25) return "crash";
  if (roll < 0.45) return "teleport";
  if (roll < 0.55) return "slew";
  return "interrupted";
}

/** Bounces and go-arounds, more frequent for a beginner (5 % and 3 % for an average pilot). */
export function disturbancesOf(
  skill: number,
  failure: Failure | null,
  random: () => number,
): Disturbance[] {
  if (failure === "crash" || failure === "teleport" || failure === "slew") return [failure];
  const roll = random();
  const bounce = 0.01 + 0.08 * (1 - skill);
  const goAround = 0.01 + 0.04 * (1 - skill);
  if (roll < bounce) return ["bounce"];
  if (roll < bounce + goAround) return ["goAround"];
  return [];
}
