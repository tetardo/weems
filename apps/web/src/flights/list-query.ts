import { AircraftCategory } from "@weems/contrats";

/** Filters of the flight list, as they appear in the page address (spec site minimal). */
export interface ListFilters {
  /** Dates as typed in the form, YYYY-MM-DD (UTC days). */
  from?: string;
  to?: string;
  aircraft?: string;
  category?: AircraftCategory;
  airport?: string;
  cursor?: string;
}

type SearchParams = Record<string, string | string[] | undefined>;

const DAY_MS = 86_400_000;
const isDay = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));

function first(value: string | string[] | undefined): string | undefined {
  const text = (Array.isArray(value) ? value[0] : value)?.trim();
  return text ? text : undefined;
}

const day = (value: string | undefined) => (value && isDay(value) ? value : undefined);
const icao = (value: string | undefined) => {
  const code = value?.toUpperCase();
  return code && /^[A-Z0-9]{4}$/.test(code) ? code : undefined;
};
const category = (value: string | undefined) => AircraftCategory.safeParse(value).data;

/** `{ key: value }`, or nothing when the value is missing: absent filters are not sent. */
function entry<K extends keyof ListFilters>(key: K, value: ListFilters[K]): Partial<ListFilters> {
  return value === undefined ? {} : { [key]: value };
}

/** Reads the filters from the address; malformed values are ignored rather than sent. */
export function readFilters(params: SearchParams): ListFilters {
  return {
    ...entry("from", day(first(params["from"]))),
    ...entry("to", day(first(params["to"]))),
    ...entry("aircraft", first(params["aircraft"])?.slice(0, 64)),
    ...entry("category", category(first(params["category"]))),
    ...entry("airport", icao(first(params["airport"]))),
    ...entry("cursor", first(params["cursor"])),
  };
}

/** Query of GET /v1/flights: "to" includes the whole day, so it becomes the next midnight. */
export function toApiQuery(filters: ListFilters): URLSearchParams {
  const query = new URLSearchParams({ limit: "50" });
  if (filters.from) query.set("from", new Date(filters.from).toISOString());
  if (filters.to) query.set("to", new Date(Date.parse(filters.to) + DAY_MS).toISOString());
  if (filters.aircraft) query.set("aircraft", filters.aircraft);
  if (filters.category) query.set("category", filters.category);
  if (filters.airport) query.set("airport", filters.airport);
  if (filters.cursor) query.set("cursor", filters.cursor);
  return query;
}

/** Filters without the page position: kept in the "older flights" link and the language switch. */
export function withoutCursor({ cursor: _cursor, ...filters }: ListFilters): ListFilters {
  return filters;
}
