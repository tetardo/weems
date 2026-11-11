import {
  PilotRoutes,
  PublicFlightList,
  PublicFlightView,
  PublicPilot,
  PublicPilotIndex,
  TrackView,
} from "@weems/contrats";
import { cache } from "react";
import type { z } from "zod";
import { apiRequest } from "./api-request.ts";

/** Public profile pages (spec J4 profil public): anonymous requests, never the visitor's cookie. */

const get = <T extends z.ZodType>(path: string, schema: T) =>
  apiRequest(path, schema, { anonymous: true });
const pilotPath = (handle: string) => `/v1/pilots/${encodeURIComponent(handle)}`;
const flightPath = (handle: string, flightId: string) =>
  `${pilotPath(handle)}/flights/${encodeURIComponent(flightId)}`;

/** Asked once per page view: the page and its metadata share the answer (React cache). */
export const getPublicPilot = cache((handle: string): Promise<PublicPilot | null> =>
  get(pilotPath(handle), PublicPilot),
);

export function getPilotRoutes(handle: string): Promise<PilotRoutes | null> {
  return get(`${pilotPath(handle)}/routes`, PilotRoutes);
}

export function getPublicFlights(
  handle: string,
  cursor: string | undefined,
): Promise<PublicFlightList | null> {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  return get(`${pilotPath(handle)}/flights${query}`, PublicFlightList);
}

export const getPublicFlight = cache(
  (handle: string, flightId: string): Promise<PublicFlightView | null> =>
    get(flightPath(handle, flightId), PublicFlightView),
);

export function getPublicTrack(handle: string, flightId: string): Promise<TrackView | null> {
  return get(`${flightPath(handle, flightId)}/track`, TrackView);
}

/** Public profiles, for the site map. */
export async function getPilotIndex(): Promise<PublicPilotIndex> {
  return (await get("/v1/pilots", PublicPilotIndex)) ?? { pilots: [] };
}
