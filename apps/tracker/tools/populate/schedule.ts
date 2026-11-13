import type { PilotRank } from "@weems/contrats";
import { SIMULATED_TYPES } from "../generate-flights/aircraft-types.ts";
import { SIMULATED_AIRPORTS } from "../generate-flights/airports/airport-data.ts";
import { destinationsOf, estimatedAirborneS, scenarioOf } from "../generate-flights/routes.ts";
import type { Scenario } from "../generate-flights/scenario.ts";
import { careerLegs, careerTarget } from "./careers.ts";
import { nextLeg, type PlannedLeg, pilotFleetOf, typeOfDay } from "./flying-styles.ts";
import { type Identity, pick } from "./identities.ts";
import type { PastFlight } from "./past-flight.ts";
import {
  careerSkills,
  disturbancesOf,
  drawFailure,
  type Failure,
  hobbySkills,
} from "./pilot-skill.ts";
import { careerDepartures, hobbyDepartures } from "./timeline.ts";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Simulator declared by the flights of the fictitious accounts. Not "replay": a replay flight is
 * never valid (founder offer, pilot ranks), and the fictitious pilots must reach their ranks. They
 * stay apart from the real pilots by their account (users.fictitious, fiche 011), and the founder
 * offer never counts them (fiche 019).
 */
export const FICTITIOUS_SIMULATOR = "msfs2024";

export interface ScheduleOptions {
  /** Flights per pilot, drawn in this range for each pilot (inclusive). */
  minFlights: number;
  maxFlights: number;
  /** Start of the history (UTC ms); flights end before `nowMs`. */
  fromMs: number;
  nowMs: number;
}

/** What one fictitious pilot flew, and when the account was created. */
export interface PilotSchedule {
  identity: Identity;
  createdAtMs: number;
  flights: PastFlight[];
  /** Rank the history was built for (careers only). */
  career?: PilotRank;
}

/** A leg as it will be flown: the pilot's skill that day, and what may go wrong. */
interface FlightPlan extends PlannedLeg {
  skill: number;
  failure: Failure | null;
}

function scenarioFor(callsign: string, plan: FlightPlan, random: () => number): Scenario {
  return scenarioOf({
    callsign,
    seed: Math.floor(random() * 2 ** 31),
    type: plan.type,
    from: plan.from,
    to: plan.to,
    disturbances: disturbancesOf(plan.skill, plan.failure, random),
    skill: plan.skill,
    simulator: FICTITIOUS_SIMULATOR,
  });
}

function pastFlightOf(
  callsign: string,
  plan: FlightPlan,
  openedAtMs: number,
  random: () => number,
): PastFlight {
  const flight = { scenario: scenarioFor(callsign, plan, random), openedAtMs };
  if (plan.failure !== "interrupted") return flight;
  return { ...flight, interruptAtShare: 0.3 + random() * 0.5 };
}

const airborneMsOf = (leg: PlannedLeg) => estimatedAirborneS(leg.type, leg.from, leg.to) * 1000;

interface Dated {
  identity: Identity;
  plans: readonly FlightPlan[];
  /** Departure of each plan kept (the first ones). */
  times: readonly number[];
  nowMs: number;
}

function scheduled(
  { identity, plans, times, nowMs }: Dated,
  random: () => number,
): Omit<PilotSchedule, "career"> {
  const flights = times.map((openedAtMs, index) =>
    pastFlightOf(identity.callsign, plans[index] as FlightPlan, openedAtMs, random),
  );
  const firstMs = flights[0]?.openedAtMs ?? nowMs;
  return { identity, createdAtMs: firstMs - (1 + random() * 20) * DAY_MS, flights };
}

/** Flights of one pilot: chained legs from the home airport, in the types of their style. */
export function scheduleOf(
  identity: Identity,
  options: ScheduleOptions,
  random: () => number,
): PilotSchedule {
  const range = options.maxFlights - options.minFlights + 1;
  const count = options.minFlights + Math.floor(random() * range);
  const fleet = pilotFleetOf(random);
  const legs: PlannedLeg[] = [];
  let at = identity.homeIcao;
  for (let i = 0; i < count; i++) {
    const pilot = { fleet, atIcao: at, homeIcao: identity.homeIcao };
    const leg = nextLeg(pilot, typeOfDay(fleet, random), random);
    legs.push(leg);
    at = leg.to.icao;
  }
  // A spoilt flight takes the place of a planned one: the count stays in the range asked.
  const skills = hobbySkills(legs.length, random);
  const plans = legs.map((leg, i) => {
    const skill = skills[i] ?? 0.5;
    return { ...leg, skill, failure: drawFailure(skill, random) };
  });
  const window = { ...options, utcOffsetH: identity.utcOffsetH };
  const times = hobbyDepartures(plans.map(airborneMsOf), window, random);
  return scheduled({ identity, plans, times, nowMs: options.nowMs }, random);
}

/**
 * Career of one pilot (spec grades des pilotes): the history that reaches `rank`, started long
 * enough ago for its number of flights (about three years for a Légende).
 */
export function careerScheduleOf(
  identity: Identity,
  rank: PilotRank,
  options: ScheduleOptions,
  random: () => number,
): PilotSchedule {
  const legs = careerLegs(careerTarget(rank, random), identity.homeIcao, random);
  const skills = careerSkills(legs.length, rank);
  // A spoilt attempt comes before the planned leg, never instead: the rank's totals hold.
  const plans = legs.flatMap((leg, i): FlightPlan[] => {
    const skill = skills[i] ?? 0.5;
    const planned = { ...leg, skill, failure: null };
    const failure = drawFailure(skill, random);
    return failure ? [{ ...leg, skill, failure }, planned] : [planned];
  });
  const window = { ...options, utcOffsetH: identity.utcOffsetH };
  const times = careerDepartures(plans.map(airborneMsOf), window, random);
  const dated = scheduled({ identity, plans, times, nowMs: options.nowMs }, random);
  return { ...dated, career: rank };
}

/** Live flights stay short enough to land during a live session. */
const LIVE_MAX_AIRBORNE_S = 4 * 3600;

/** A flight for the live activity: any type, from an airport it can use, at most 4 hours. */
export function liveScenario(callsign: string, random: () => number): Scenario {
  const type = pick(random, SIMULATED_TYPES);
  const from = pick(
    random,
    SIMULATED_AIRPORTS.filter((airport) => destinationsOf(type, airport).length > 0),
  );
  const near = destinationsOf(type, from).filter(
    (to) => estimatedAirborneS(type, from, to) <= LIVE_MAX_AIRBORNE_S,
  );
  const to = pick(random, near.length > 0 ? near : destinationsOf(type, from));
  return scenarioFor(
    callsign,
    { type, from, to, skill: 0.2 + random() * 0.7, failure: null },
    random,
  );
}
