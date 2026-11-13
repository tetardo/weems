import { landingSummary, type LogbookStats } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { sum } from "../profiles/sum.ts";
import { groupBy, meanOf } from "./tally.ts";

const AIRCRAFT_SHOWN = 6;
const AIRPORTS_SHOWN = 5;
const ROUTES_SHOWN = 4;

type Flights = readonly SummaryWithEvents[];

const airborne = (flights: Flights) =>
  sum(flights.map(({ summary }) => summary.times.airborneS ?? 0));

const categoryOf = ({ summary }: SummaryWithEvents) => summary.aircraftClass?.category ?? null;

/** Most airborne time first. */
const byTime = <T extends { airborneS: number }>(a: T, b: T) => b.airborneS - a.airborneS;

/** « Catégories »: airborne time by aircraft category. */
export function categoriesOf(flights: Flights): LogbookStats["categories"] {
  return [...groupBy(flights, categoryOf)]
    .map(([category, group]) => ({ category, flights: group.length, airborneS: airborne(group) }))
    .sort(byTime);
}

/** « Avions »: the most flown aircraft (ICAO type, else title of the simulator). */
export function aircraftOf(flights: Flights): LogbookStats["aircraft"] {
  const groups = groupBy(flights, ({ summary }) => summary.aircraftModel ?? summary.aircraftTitle);
  return [...groups]
    .map(([name, group]) => ({
      name,
      category: group[0] ? categoryOf(group[0]) : null,
      flights: group.length,
      airborneS: airborne(group),
    }))
    .sort((a, b) => b.flights - a.flights || byTime(a, b))
    .slice(0, AIRCRAFT_SHOWN);
}

/** « Aéroports »: departures and arrivals at each airport, most visited first. */
export function airportsOf(
  flights: Flights,
  nameOf: (icao: string) => string | null,
): LogbookStats["airports"] {
  const codes = flights.flatMap(({ summary }) =>
    [summary.departureIcao, summary.plannedArrivalIcao].filter((c): c is string => c !== null),
  );
  return [...groupBy(codes, (code) => code)]
    .map(([icao, visits]) => ({ icao, name: nameOf(icao), visits: visits.length }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, AIRPORTS_SHOWN);
}

/** The two airports of a flight in alphabetical order; null unless both are known and differ. */
function routeKey({ summary }: SummaryWithEvents): string | null {
  const { departureIcao: a, plannedArrivalIcao: b } = summary;
  if (!a || !b || a === b) return null;
  return [a, b].sort().join(">");
}

/** « Routes favorites »: routes flown both ways counted together, most flown first. */
export function favoriteRoutes(flights: Flights): LogbookStats["routes"] {
  const groups = groupBy(flights, routeKey);
  groups.delete(null);
  return [...groups]
    .map(([key, group]) => {
      const [a = "", b = ""] = (key ?? "").split(">");
      const touchdowns = group.flatMap(({ events }) => landingSummary(events)?.touchdownVs ?? []);
      return {
        airports: [a, b] as [string, string],
        flights: group.length,
        blockS: sum(group.map(({ summary }) => summary.times.blockS ?? 0)),
        touchdownAverage: meanOf(touchdowns),
      };
    })
    .sort((x, y) => y.flights - x.flights)
    .slice(0, ROUTES_SHOWN);
}
