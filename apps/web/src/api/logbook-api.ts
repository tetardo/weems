import {
  FlightBands,
  LogbookEntries,
  LogbookStats,
  type LogbookStatsPeriod,
  LogbookSummary,
  PilotLogbook,
  PilotRoutes,
  PublicFlightList,
} from "@weems/contrats";
import { cache } from "react";
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

/** Page Vols: every closed flight with its verdict, read once per page (list and sheet). */
export const getLogbookEntries = cache((): Promise<LogbookEntries | null> =>
  apiRequest("/v1/me/logbook/entries", LogbookEntries),
);

/** Flight bands of one of the pilot's flights; null without trajectory. */
export function getFlightBands(flightId: string): Promise<FlightBands | null> {
  return apiRequest(`/v1/me/logbook/flights/${encodeURIComponent(flightId)}/bands`, FlightBands);
}

/** Page Statistiques over a period; the API gives 12 months instead of « all » without Pilot Pro. */
export function getLogbookStats(period: LogbookStatsPeriod): Promise<LogbookStats | null> {
  return apiRequest(`/v1/me/logbook/stats?period=${period}`, LogbookStats);
}
