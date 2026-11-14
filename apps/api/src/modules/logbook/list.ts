import type {
  LandingVerdict,
  LogbookEntry,
  LogbookList,
  LogbookListEntry,
  LogbookListFilter,
  LogbookListQuery,
  LogbookListSort,
} from "@weems/contrats";

/** Verdicts listed under « À revoir ». */
const TO_REVIEW: ReadonlySet<LandingVerdict> = new Set(["firm", "bounce", "nonCompliant"]);

function keep(entry: LogbookEntry, filter: LogbookListFilter): boolean {
  if (filter === "clean") return entry.verdict === "clean";
  if (filter === "review") return TO_REVIEW.has(entry.verdict);
  return true;
}

/** Search text of a line: codes, airport names, aircraft and callsign. */
function searchText({ flight, departureName, arrivalName }: LogbookListEntry): string {
  const { departureIcao, plannedArrivalIcao, aircraftModel, aircraftTitle, callsign } = flight;
  return [departureIcao, plannedArrivalIcao, departureName, arrivalName]
    .concat([aircraftModel, aircraftTitle, callsign])
    .filter((part) => part !== null)
    .join(" ")
    .toLowerCase();
}

/** Value sorted on; null (not measured) always goes last. Touchdown: the softest is the smallest. */
function sortValue(entry: LogbookEntry, sort: LogbookListSort): number | null {
  if (sort === "block") return entry.flight.times.blockS;
  if (sort === "touchdown") return entry.touchdownVs === null ? null : Math.abs(entry.touchdownVs);
  return Date.parse(entry.flight.openedAt);
}

function sorted(lines: LogbookListEntry[], { sort, order }: LogbookListQuery): LogbookListEntry[] {
  const sign = order === "asc" ? 1 : -1;
  return lines
    .map((line, index) => ({ line, index, value: sortValue(line, sort) }))
    .sort((a, b) => {
      if (a.value === null || b.value === null) {
        if (a.value === b.value) return a.index - b.index;
        return a.value === null ? 1 : -1;
      }
      return (a.value - b.value) * sign || a.index - b.index;
    })
    .map(({ line }) => line);
}

/**
 * Page Vols as a list: names of the airports, then search, filter, sort and the asked slice.
 * `entries` are every closed flight of the pilot, newest first.
 */
export function logbookList(
  entries: readonly LogbookEntry[],
  query: LogbookListQuery,
  airportName: (icao: string | null) => string | null,
): LogbookList {
  const needle = query.q?.toLowerCase() ?? "";
  const matching = entries
    .filter((entry) => keep(entry, query.filter))
    .map((entry) => ({
      ...entry,
      departureName: airportName(entry.flight.departureIcao),
      arrivalName: airportName(entry.flight.plannedArrivalIcao),
    }))
    .filter((line) => needle === "" || searchText(line).includes(needle));
  const end = query.offset + query.limit;
  return {
    entries: sorted(matching, query).slice(query.offset, end),
    matching: matching.length,
    total: entries.length,
    nextOffset: end < matching.length ? end : null,
  };
}
