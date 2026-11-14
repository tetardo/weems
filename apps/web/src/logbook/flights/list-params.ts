import {
  LOGBOOK_LIST_FILTERS,
  LOGBOOK_LIST_PAGE,
  LOGBOOK_LIST_SORTS,
  type LogbookListFilter,
  type LogbookListSort,
  type SortOrder,
} from "@weems/contrats";

/** State of the page Vols, kept in its address so that every view can be linked and reloaded. */
export interface ListParams {
  q: string;
  filter: LogbookListFilter;
  sort: LogbookListSort;
  order: SortOrder;
  /** Lines shown: 50, then 50 more at each « Charger 50 vols de plus ». */
  shown: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

const DEFAULTS: ListParams = {
  q: "",
  filter: "all",
  sort: "date",
  order: "desc",
  shown: LOGBOOK_LIST_PAGE,
};
/** Most lines one address can ask for (the API's own limit). */
const MAX_SHOWN = 1000;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const among = <T extends string>(list: readonly T[], value: string | undefined, fallback: T) =>
  list.find((item) => item === value) ?? fallback;

function shownOf(value: string | undefined): number {
  const pages = Math.ceil(Number(value) / LOGBOOK_LIST_PAGE);
  return Number.isFinite(pages) && pages > 0
    ? Math.min(pages * LOGBOOK_LIST_PAGE, MAX_SHOWN)
    : LOGBOOK_LIST_PAGE;
}

/** The page's state read from `?q=&f=&sort=&order=&n=`; unknown values fall back to the defaults. */
export function listParamsOf(search: SearchParams): ListParams {
  return {
    q: (one(search["q"]) ?? "").trim().slice(0, 64),
    filter: among(LOGBOOK_LIST_FILTERS, one(search["f"]), "all"),
    sort: among(LOGBOOK_LIST_SORTS, one(search["sort"]), "date"),
    order: one(search["order"]) === "asc" ? "asc" : "desc",
    shown: shownOf(one(search["n"])),
  };
}

/** Address of the page with some state changed; the defaults are left out of it. */
export function listHref(params: ListParams, change: Partial<ListParams> = {}): string {
  const next = { ...params, ...change };
  const query = new URLSearchParams();
  if (next.q) query.set("q", next.q);
  if (next.filter !== DEFAULTS.filter) query.set("f", next.filter);
  if (next.sort !== DEFAULTS.sort || next.order !== DEFAULTS.order) {
    query.set("sort", next.sort);
    query.set("order", next.order);
  }
  if (next.shown !== DEFAULTS.shown) query.set("n", String(next.shown));
  const text = query.toString();
  return `/logbook/flights${text ? `?${text}` : ""}`;
}

/** Sorting by a column: a first click sorts it (newest, longest, softest first), a second inverts. */
export function sortHref(params: ListParams, sort: LogbookListSort): string {
  const first: SortOrder = sort === "touchdown" ? "asc" : "desc";
  const order = params.sort === sort ? (params.order === "asc" ? "desc" : "asc") : first;
  return listHref(params, { sort, order, shown: LOGBOOK_LIST_PAGE });
}
