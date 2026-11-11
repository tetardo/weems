/** Filters of the flight list, as they appear in the page address (spec site minimal). */
export interface ListFilters {
  /** Dates as typed in the form, YYYY-MM-DD (UTC days). */
  from?: string;
  to?: string;
  aircraft?: string;
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

/** Reads the filters from the address; malformed values are ignored rather than sent. */
export function readFilters(params: SearchParams): ListFilters {
  const from = first(params["from"]);
  const to = first(params["to"]);
  const airport = first(params["airport"])?.toUpperCase();
  const aircraft = first(params["aircraft"]);
  const cursor = first(params["cursor"]);
  return {
    ...(from && isDay(from) && { from }),
    ...(to && isDay(to) && { to }),
    ...(aircraft && { aircraft: aircraft.slice(0, 64) }),
    ...(airport && /^[A-Z0-9]{4}$/.test(airport) && { airport }),
    ...(cursor && { cursor }),
  };
}

/** Query of GET /v1/flights: "to" includes the whole day, so it becomes the next midnight. */
export function toApiQuery(filters: ListFilters): URLSearchParams {
  const query = new URLSearchParams({ limit: "50" });
  if (filters.from) query.set("from", new Date(filters.from).toISOString());
  if (filters.to) query.set("to", new Date(Date.parse(filters.to) + DAY_MS).toISOString());
  if (filters.aircraft) query.set("aircraft", filters.aircraft);
  if (filters.airport) query.set("airport", filters.airport);
  if (filters.cursor) query.set("cursor", filters.cursor);
  return query;
}

/** Filters without the page position: kept in the "older flights" link and the language switch. */
export function withoutCursor({ cursor: _cursor, ...filters }: ListFilters): ListFilters {
  return filters;
}
