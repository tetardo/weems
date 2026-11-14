import { z } from "zod";
import { LogbookEntry } from "./logbook-flights.ts";

/**
 * Page Vols of the private logbook as a list (Greg, 14/11/2026, maquette v14-liste): searched,
 * filtered, sorted and read 50 flights at a time.
 */

/** Filters of the list: every flight, the clean ones, the ones to review. */
export const LOGBOOK_LIST_FILTERS = ["all", "clean", "review"] as const;
export const LogbookListFilter = z.enum(LOGBOOK_LIST_FILTERS);
export type LogbookListFilter = z.infer<typeof LogbookListFilter>;

/** Columns the list can be sorted by: date, block time, touchdown (softest first when ascending). */
export const LOGBOOK_LIST_SORTS = ["date", "block", "touchdown"] as const;
export const LogbookListSort = z.enum(LOGBOOK_LIST_SORTS);
export type LogbookListSort = z.infer<typeof LogbookListSort>;

export const SortOrder = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof SortOrder>;

/** Lines read at a time by the button « Charger 50 vols de plus ». */
export const LOGBOOK_LIST_PAGE = 50;

/** GET /v1/me/logbook/list query. */
export const LogbookListQuery = z.object({
  /** ICAO code, airport name, aircraft or callsign, any case. */
  q: z.string().trim().max(64).optional(),
  filter: LogbookListFilter.default("all"),
  sort: LogbookListSort.default("date"),
  order: SortOrder.default("desc"),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(1000).default(LOGBOOK_LIST_PAGE),
});
export type LogbookListQuery = z.infer<typeof LogbookListQuery>;

/** A line of the list: the entry, with the short names of its airports (OurAirports, English). */
export const LogbookListEntry = LogbookEntry.extend({
  departureName: z.string().nullable(),
  arrivalName: z.string().nullable(),
});
export type LogbookListEntry = z.infer<typeof LogbookListEntry>;

export const LogbookList = z.object({
  entries: z.array(LogbookListEntry),
  /** Flights matching the search and the filter. */
  matching: z.number().int().nonnegative(),
  /** Every closed flight of the pilot. */
  total: z.number().int().nonnegative(),
  /** Offset of the next lines; null when every matching flight is read. */
  nextOffset: z.number().int().nonnegative().nullable(),
});
export type LogbookList = z.infer<typeof LogbookList>;
