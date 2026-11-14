import { getLogbookList } from "../../api/logbook-api.ts";
import type { ListParams } from "./list-params.ts";

/** The lines of the page Vols for its state: always from the first, as many as shown. */
export function loadList(params: ListParams) {
  const query = new URLSearchParams({
    filter: params.filter,
    sort: params.sort,
    order: params.order,
    limit: String(params.shown),
  });
  if (params.q) query.set("q", params.q);
  return getLogbookList(query);
}
