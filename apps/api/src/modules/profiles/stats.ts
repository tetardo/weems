import { distanceNm, type PilotStats, type TrackPoint } from "@weems/contrats";
import type { SummaryWithEvents } from "../flights/service.ts";
import { dayAndNight } from "./day-night.ts";
import { finalLandings, measured } from "./landings.ts";
import { weeklyStreak } from "./streak.ts";

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

/** Length of a trajectory, nautical miles, point to point. */
function lengthNm(points: readonly TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    if (a && b) total += distanceNm(a.lat, a.lon, b.lat, b.lon);
  }
  return total;
}

/** Touchdown statistics: mean, softest, share of clean final landings. */
function landingStats(flights: readonly SummaryWithEvents[]) {
  const landings = finalLandings(flights);
  const withVs = measured(landings);
  return {
    averageTouchdownVs:
      withVs.length === 0 ? null : sum(withVs.map((l) => l.touchdownVs)) / withVs.length,
    // Softest: the vertical speed closest to zero (they are negative).
    bestLanding: withVs.reduce<Landing | null>(
      (best, { touchdownVs, airportIcao, at }) =>
        !best || touchdownVs > best.touchdownVs ? { touchdownVs, airportIcao, at } : best,
      null,
    ),
    cleanLandings: { clean: landings.filter((l) => l.clean).length, landings: landings.length },
  };
}

/**
 * Statistics of a public profile, from its public flights and their simplified trajectories
 * (spec J4 profil public).
 */
export function pilotStats(
  flights: readonly SummaryWithEvents[],
  tracks: ReadonlyMap<string, readonly TrackPoint[]>,
  now: Date,
): PilotStats {
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
    ...landingStats(flights),
    longestFlight: longestOf(flights),
    goArounds: sum(flights.map(({ events }) => events.filter((e) => e.type === "goAround").length)),
    ...dayAndNight(tracks.values()),
    distanceNm: sum([...tracks.values()].map(lengthNm)),
    streak: weeklyStreak(
      flights.map(({ summary }) => new Date(summary.openedAt)),
      now,
    ),
  };
}
