import { airportOf } from "../generate-flights/airports/airport-data.ts";
import { TYPES } from "../generate-flights/fleet.ts";
import type { Disturbance, Scenario } from "../generate-flights/scenario.ts";
import { HOMES, type Identity, pick } from "./identities.ts";
import type { PastFlight } from "./past-flight.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
/** Europe in winter: the fleet's airports are at UTC+0 to UTC+1; one hour is close enough. */
const LOCAL_OFFSET_MS = HOUR_MS;

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
}

/** Local departure hour: mostly evenings and mornings, as a hobby (spec admin, Activité simulée). */
function localHour(random: () => number): number {
  const slot = random();
  if (slot < 0.3) return 7 + random() * 3; // before work
  if (slot < 0.55) return 11 + random() * 5;
  return 18 + random() * 4; // evening
}

/** A day of the history, weekends twice as likely. */
function dayOf(random: () => number, options: ScheduleOptions): number {
  const days = Math.max(1, Math.floor((options.nowMs - options.fromMs) / DAY_MS));
  for (;;) {
    const day = options.fromMs + Math.floor(random() * days) * DAY_MS;
    const weekend = [0, 6].includes(new Date(day).getUTCDay());
    if (weekend || random() < 0.5) return day - (day % DAY_MS);
  }
}

function disturbancesOf(random: () => number): Disturbance[] {
  const roll = random();
  if (roll < 0.05) return ["bounce"];
  if (roll < 0.08) return ["goAround"];
  return [];
}

function scenarioOf(
  callsign: string,
  route: { from: string; to: string },
  type: (typeof TYPES)[number],
  random: () => number,
): Scenario {
  return {
    name: `${route.from.toLowerCase()}-${route.to.toLowerCase()}`,
    callsign,
    seed: Math.floor(random() * 2 ** 31),
    aircraft: type.aircraft,
    departure: airportOf(route.from),
    arrival: airportOf(route.to),
    cruiseAltFt: type.cruiseAltFt,
    cruiseGs: type.cruiseGs,
    approachGs: type.approachGs,
    disturbances: disturbancesOf(random),
  };
}

/** Departure times in order, at least 4 hours apart (a flight ends before the next one). */
function departures(count: number, random: () => number, options: ScheduleOptions): number[] {
  const times = Array.from(
    { length: count },
    () => dayOf(random, options) + localHour(random) * HOUR_MS - LOCAL_OFFSET_MS,
  ).sort((a, b) => a - b);
  for (let i = 1; i < times.length; i++) {
    times[i] = Math.max(times[i] ?? 0, (times[i - 1] ?? 0) + 4 * HOUR_MS);
  }
  // Kept in the history: the first day starts at midnight, maybe before `fromMs`, and the
  // spacing may push the last ones past now.
  return times.filter((at) => at >= options.fromMs && at < options.nowMs - 4 * HOUR_MS);
}

/** Next leg: home when away more often than not, otherwise anywhere else in the fleet. */
function nextLeg(at: string, home: string, random: () => number): { from: string; to: string } {
  if (at !== home && random() < 0.6) return { from: at, to: home };
  return {
    from: at,
    to: pick(
      random,
      HOMES.filter((h) => h.icao !== at),
    ).icao,
  };
}

/** Flights of one pilot: chained legs from the home airport, a favourite type most of the time. */
export function scheduleOf(
  identity: Identity,
  options: ScheduleOptions,
  random: () => number,
): PilotSchedule {
  const range = options.maxFlights - options.minFlights + 1;
  const count = options.minFlights + Math.floor(random() * range);
  const favourite = pick(random, TYPES);
  let at = identity.homeIcao;
  const flights = departures(count, random, options).map((openedAtMs) => {
    const leg = nextLeg(at, identity.homeIcao, random);
    at = leg.to;
    const type = random() < 0.6 ? favourite : pick(random, TYPES);
    return { scenario: scenarioOf(identity.callsign, leg, type, random), openedAtMs };
  });
  const firstMs = flights[0]?.openedAtMs ?? options.nowMs;
  return { identity, createdAtMs: firstMs - (1 + random() * 20) * DAY_MS, flights };
}

/** A flight for the live activity: from any airport of the fleet, any type. */
export function liveScenario(callsign: string, random: () => number): Scenario {
  const from = pick(random, HOMES).icao;
  return scenarioOf(callsign, nextLeg(from, from, random), pick(random, TYPES), random);
}
