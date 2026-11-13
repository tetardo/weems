import { PilotRank, RANK_THRESHOLDS } from "@weems/contrats";
import {
  type SimulatedType,
  type TypeFamily,
  typesOf,
} from "../generate-flights/aircraft-types.ts";
import { airportOf } from "../generate-flights/airports/airport-data.ts";
import { destinationsOf, estimatedAirborneS } from "../generate-flights/routes.ts";
import { pick } from "./identities.ts";
import type { PlannedLeg } from "./flying-styles.ts";

/**
 * Careers of the fictitious pilots (spec grades des pilotes): one account per rank, from Élève to
 * Légende, with exactly the history that reaches it. The API computes the rank on its own from the
 * flights (valid hours AND valid flights): nothing here is stored as a rank.
 */

/** Valid hours and flights a career aims at. */
export interface CareerTarget {
  rank: PilotRank;
  flights: number;
  hours: number;
}

/** Hours are estimated before flying (±10 %): the target is kept this far above the threshold. */
const HOURS_MARGIN = 1.12;
/** Share of the gap to the next rank a career may go into, never close to the next threshold. */
const GAP_SHARE = 0.1;

/** What a career aims at: just past its rank's thresholds, well under the next ones. */
export function careerTarget(rank: PilotRank, random: () => number): CareerTarget {
  const need = RANK_THRESHOLDS[rank];
  const following = PilotRank.options[PilotRank.options.indexOf(rank) + 1];
  if (!following) {
    return {
      rank,
      flights: need.flights + Math.round(random() * 40),
      hours: need.hours * HOURS_MARGIN + random() * 100,
    };
  }
  const next = RANK_THRESHOLDS[following];
  if (rank === "student") return { rank, flights: 1 + Math.round(random()), hours: 0 };
  return {
    rank,
    flights: need.flights + Math.round(random() * GAP_SHARE * (next.flights - need.flights)),
    hours: need.hours * HOURS_MARGIN + random() * GAP_SHARE * (next.hours - need.hours),
  };
}

/** Types flown on the way: club aircraft at the start, airliners and long haul for the senior ranks. */
function familiesOf(rank: PilotRank): TypeFamily[] {
  const index = PilotRank.options.indexOf(rank);
  if (index <= 2) return ["light", "turboprop"];
  if (index <= 4) return ["light", "turboprop", "regional", "narrow"];
  return ["business", "regional", "narrow", "wide"];
}

/** Longer than any simulated leg. */
const LONGEST_H = 12;

interface Option extends PlannedLeg {
  hours: number;
}

function optionsFrom(types: readonly SimulatedType[], atIcao: string): Option[] {
  const from = airportOf(atIcao);
  return types.flatMap((type) =>
    destinationsOf(type, from).map((to) => ({
      type,
      from,
      to,
      hours: estimatedAirborneS(type, from, to) / 3600,
    })),
  );
}

/** Among the legs closest to the hours wanted per flight, one drawn at random. */
function closest(options: readonly Option[], hours: number, random: () => number): Option {
  const sorted = [...options].sort((a, b) => Math.abs(a.hours - hours) - Math.abs(b.hours - hours));
  return pick(random, sorted.slice(0, 6));
}

/** A planned career leg, with the airborne time it should count. */
export interface CareerLeg extends PlannedLeg {
  estimatedHours: number;
}

/**
 * Chained legs from the home airport until both targets are met: each leg is chosen near the
 * hours per flight still needed, so the totals land just past the thresholds of the rank.
 */
export function careerLegs(
  target: CareerTarget,
  homeIcao: string,
  random: () => number,
): CareerLeg[] {
  const types = typesOf(familiesOf(target.rank));
  const legs: CareerLeg[] = [];
  let hours = 0;
  let at = homeIcao;
  while (legs.length < target.flights || hours < target.hours) {
    const options = optionsFrom(types, at);
    const flightsLeft = target.flights - legs.length;
    // Flights all done but hours missing: the longest legs.
    const wanted = flightsLeft > 0 ? (target.hours - hours) / flightsLeft : LONGEST_H;
    const usable = options.length > 0 ? options : optionsFrom(typesOf(["wide"]), at);
    const chosen = closest(usable, wanted, random);
    legs.push({
      type: chosen.type,
      from: chosen.from,
      to: chosen.to,
      estimatedHours: chosen.hours,
    });
    hours += chosen.hours;
    at = chosen.to.icao;
  }
  return legs;
}
