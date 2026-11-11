import { FlightList, FlightView, TrackView } from "@weems/contrats";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { forwardedCookies } from "../auth/server-session.ts";
import { serverApiUrl } from "../site/api-url.ts";

/** The API did not answer, or answered something unexpected. */
export class ApiUnavailable extends Error {
  readonly url: string;
  constructor(url: string, cause: unknown) {
    super(`Weems API unavailable at ${url}`, { cause });
    this.url = url;
  }
}

/**
 * GET on the API from the site's server, as the logged-in pilot (session cookie forwarded).
 * Null when the resource does not exist or is another pilot's (404); expired session → login page.
 */
async function get<T extends z.ZodType>(path: string, schema: T): Promise<z.infer<T> | null> {
  const url = serverApiUrl();
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, {
      headers: { cookie: await forwardedCookies() },
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiUnavailable(url, error);
  }
  if (response.status === 401) redirect("/login");
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiUnavailable(url, new Error(`HTTP ${response.status}`));
  return schema.parse(await response.json());
}

export async function listFlights(query: URLSearchParams): Promise<FlightList> {
  const list = await get(`/v1/flights?${query.toString()}`, FlightList);
  return list ?? { flights: [], nextCursor: null };
}

export function getFlight(flightId: string): Promise<FlightView | null> {
  return get(`/v1/flights/${encodeURIComponent(flightId)}`, FlightView);
}

export function getTrack(flightId: string): Promise<TrackView | null> {
  return get(`/v1/flights/${encodeURIComponent(flightId)}/track`, TrackView);
}
