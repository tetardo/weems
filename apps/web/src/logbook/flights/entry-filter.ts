import type { LandingVerdict, LogbookEntry } from "@weems/contrats";

/** Filters of the page Vols: every flight, the clean ones, the ones to review. */
export const ENTRY_FILTERS = ["all", "clean", "review"] as const;
export type EntryFilter = (typeof ENTRY_FILTERS)[number];

const TO_REVIEW: ReadonlySet<LandingVerdict> = new Set(["firm", "bounce", "nonCompliant"]);

/** The filter named in the address (`?f=`), « all » when missing or unknown. */
export function entryFilterOf(param: string | string[] | undefined): EntryFilter {
  return ENTRY_FILTERS.find((f) => f === param) ?? "all";
}

export function filterEntries(
  entries: readonly LogbookEntry[],
  filter: EntryFilter,
): LogbookEntry[] {
  if (filter === "clean") return entries.filter((e) => e.verdict === "clean");
  if (filter === "review") return entries.filter((e) => TO_REVIEW.has(e.verdict));
  return [...entries];
}

/** Address of a page of the list, keeping the filter. */
export const flightsHref = (filter: EntryFilter, flightId?: string) =>
  `/logbook/flights${flightId ? `/${flightId}` : ""}${filter === "all" ? "" : `?f=${filter}`}`;
