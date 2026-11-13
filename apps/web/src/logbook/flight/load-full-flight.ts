import { getFlightBands, getLogbookEntries } from "../../api/logbook-api.ts";
import { getVisibility } from "../../api/profile-api.ts";
import { getFlight, getReview, getTrack } from "../../api/weems-api.ts";
import { getMyFeatures } from "../../plans/my-features.ts";
import { aircraftComparison } from "./aircraft-comparison.ts";

/**
 * Everything the full page of a flight shows (maquette v13, A); null when the flight is not one of
 * the pilot's closed flights. `older` and `newer`: the neighbours in the logbook, newest first.
 */
export async function loadFullFlight(flightId: string) {
  const entries = (await getLogbookEntries())?.entries ?? [];
  const index = entries.findIndex((e) => e.flight.flightId === flightId);
  const entry = entries[index];
  if (!entry) return null;
  const [flight, track, bands, review, visibility, features] = await Promise.all([
    getFlight(flightId),
    getTrack(flightId),
    getFlightBands(flightId),
    getReview(flightId),
    getVisibility(flightId),
    getMyFeatures(),
  ]);
  if (!flight) return null;
  const compare = features.has("sameAircraftComparison");
  const neighbour = (i: number) => entries[i]?.flight.flightId ?? null;
  return {
    entry,
    flight,
    points: track ? track.points : [],
    bands,
    review,
    hiddenOnProfile: visibility ? visibility.hiddenOnProfile : null,
    comparison: compare ? aircraftComparison(entry, entries) : null,
    compareLocked: !compare,
    older: neighbour(index + 1),
    newer: neighbour(index - 1),
  };
}

export type FullFlight = NonNullable<Awaited<ReturnType<typeof loadFullFlight>>>;
