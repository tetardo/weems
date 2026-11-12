import { LogbookSummary, PilotLogbook, PilotRoutes, PublicFlightList } from "@weems/contrats";
import { apiRequest } from "./api-request.ts";

/** The logged-in pilot's logbook: their public page, readable even while it is not public. */

export function getMyLogbook(): Promise<PilotLogbook | null> {
  return apiRequest("/v1/me/logbook", PilotLogbook);
}

export function getMyLogbookRoutes(): Promise<PilotRoutes | null> {
  return apiRequest("/v1/me/logbook/routes", PilotRoutes);
}

export function getMyLogbookFlights(cursor: string | undefined): Promise<PublicFlightList | null> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest(`/v1/me/logbook/flights${query}`, PublicFlightList);
}

/** Page Résumé of the private logbook: every closed flight, hidden ones included. */
export function getLogbookSummary(): Promise<LogbookSummary | null> {
  return apiRequest("/v1/me/logbook/summary", LogbookSummary);
}
