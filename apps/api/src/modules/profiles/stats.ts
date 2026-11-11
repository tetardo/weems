import { landingSummary, type PilotStats, type TrackPoint } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { dayAndNight, monthlyActivity } from "./activity.ts";

type Landing = NonNullable<PilotStats["bestLanding"]>;

const aircraftKey = ({ summary }: SummaryWithEvents) =>
  summary.aircraftModel ?? summary.aircraftTitle;

function mostFrequent(flights: readonly SummaryWithEvents[]): string | null {
  const counts = new Map<string, { count: number; title: string }>();
  for (const flight of flights) {
    const entry = counts.get(aircraftKey(flight)) ?? {
      count: 0,
      title: flight.summary.aircraftTitle,
    };
    counts.set(aircraftKey(flight), { ...entry, count: entry.count + 1 });
  }
  let best: { count: number; title: string } | null = null;
  for (const entry of counts.values()) if (!best || entry.count > best.count) best = entry;
  return best?.title ?? null;
}

/** Vertical speed of each flight's final touchdown, where measured. */
function landingsOf(flights: readonly SummaryWithEvents[]): Landing[] {
  return flights.flatMap(({ summary, events }) => {
    const touchdownVs = landingSummary(events)?.touchdownVs ?? null;
    if (touchdownVs === null) return [];
    return [{ touchdownVs, airportIcao: summary.plannedArrivalIcao, at: summary.openedAt }];
  });
}

function longestOf(flights: readonly SummaryWithEvents[]): PilotStats["longestFlight"] {
  let longest: SummaryWithEvents | null = null;
  for (const flight of flights) {
    if ((flight.summary.times.blockS ?? 0) > (longest?.summary.times.blockS ?? 0)) longest = flight;
  }
  if (!longest) return null;
  const { times, departureIcao, plannedArrivalIcao } = longest.summary;
  return { blockS: times.blockS ?? 0, departureIcao, arrivalIcao: plannedArrivalIcao };
}

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/**
 * Statistics of a public profile, from its public flights and their simplified trajectories
 * (spec J4 profil public).
 */
export function pilotStats(
  flights: readonly SummaryWithEvents[],
  tracks: ReadonlyMap<string, readonly TrackPoint[]>,
  now: Date,
): PilotStats {
  const landings = landingsOf(flights);
  const airports = new Set(
    flights.flatMap(({ summary }) => [summary.departureIcao, summary.plannedArrivalIcao]),
  );
  airports.delete(null);
  return {
    flights: flights.length,
    airborneS: sum(flights.map(({ summary }) => summary.times.airborneS ?? 0)),
    blockS: sum(flights.map(({ summary }) => summary.times.blockS ?? 0)),
    airports: airports.size,
    aircraft: new Set(flights.map(aircraftKey)).size,
    favoriteAircraft: mostFrequent(flights),
    averageTouchdownVs:
      landings.length === 0 ? null : sum(landings.map((l) => l.touchdownVs)) / landings.length,
    // Softest: the vertical speed closest to zero (they are negative).
    bestLanding: landings.reduce<Landing | null>(
      (best, landing) => (!best || landing.touchdownVs > best.touchdownVs ? landing : best),
      null,
    ),
    longestFlight: longestOf(flights),
    goArounds: sum(flights.map(({ events }) => events.filter((e) => e.type === "goAround").length)),
    ...dayAndNight(tracks.values()),
    months: monthlyActivity(flights, now),
  };
}
