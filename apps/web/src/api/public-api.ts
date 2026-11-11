import {
  PilotRoutes,
  PublicFlightList,
  PublicFlightView,
  PublicPilot,
  PublicPilotIndex,
  TrackView,
} from "@weems/contrats";
import type { z } from "zod";
import { apiRequest } from "./api-request.ts";

/** Public profile pages (spec J4 profil public): anonymous requests, never the visitor's cookie. */

const get = <T extends z.ZodType>(path: string, schema: T) =>
  apiRequest(path, schema, { anonymous: true });
const pilotPath = (handle: string) => `/v1/pilots/${encodeURIComponent(handle)}`;
const flightPath = (handle: string, flightId: string) =>
  `${pilotPath(handle)}/flights/${encodeURIComponent(flightId)}`;

export function getPublicPilot(handle: string): Promise<PublicPilot | null> {
  return get(pilotPath(handle), PublicPilot);
}

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

export function getPublicFlight(
  handle: string,
  flightId: string,
): Promise<PublicFlightView | null> {
  return get(flightPath(handle, flightId), PublicFlightView);
}

export function getPublicTrack(handle: string, flightId: string): Promise<TrackView | null> {
  return get(`${flightPath(handle, flightId)}/track`, TrackView);
}

/** Public profiles, for the site map. */
export async function getPilotIndex(): Promise<PublicPilotIndex> {
  return (await get("/v1/pilots", PublicPilotIndex)) ?? { pilots: [] };
}
