import { getFlightBands, getLogbookEntries } from "../../api/logbook-api.ts";
import { getTrack } from "../../api/weems-api.ts";
import { type EntryFilter, filterEntries } from "./entry-filter.ts";

/**
 * Data of the page Vols: the filtered list, and the named flight (else the newest shown) with its
 * bands and trajectory; `total` counts every flight. Null when the API does not know the pilot's logbook; `selected` null without
 * flights, or when the named flight is not the pilot's.
 */
export async function loadFlightsPage(flightId: string | null, filter: EntryFilter) {
  const list = await getLogbookEntries();
  if (!list) return null;
  const entries = filterEntries(list.entries, filter);
  const total = list.entries.length;
  const entry = flightId ? list.entries.find((e) => e.flight.flightId === flightId) : entries[0];
  if (!entry) return { entries, total, selected: null };
  const id = entry.flight.flightId;
  const [bands, track] = await Promise.all([getFlightBands(id), getTrack(id)]);
  return { entries, total, selected: { entry, bands, track } };
}
