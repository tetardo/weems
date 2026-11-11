import {
  type FlightReview,
  FlightList,
  FlightReviewView,
  FlightView,
  TrackView,
} from "@weems/contrats";
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
 * A request to the API from the site's server, as the logged-in pilot (session cookie forwarded).
 * Null when the resource does not exist or is another pilot's (404); expired session → login page.
 */
async function request<T extends z.ZodType>(
  path: string,
  schema: T,
  write?: { method: "PUT"; body: unknown },
): Promise<z.infer<T> | null> {
  const url = serverApiUrl();
  const headers: Record<string, string> = { cookie: await forwardedCookies() };
  if (write) headers["content-type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, {
      method: write?.method ?? "GET",
      headers,
      body: write ? JSON.stringify(write.body) : null,
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

const get = <T extends z.ZodType>(path: string, schema: T) => request(path, schema);
const flightPath = (flightId: string) => `/v1/flights/${encodeURIComponent(flightId)}`;

export async function listFlights(query: URLSearchParams): Promise<FlightList> {
  const list = await get(`/v1/flights?${query.toString()}`, FlightList);
  return list ?? { flights: [], nextCursor: null };
}

export function getFlight(flightId: string): Promise<FlightView | null> {
  return get(flightPath(flightId), FlightView);
}

export function getTrack(flightId: string): Promise<TrackView | null> {
  return get(`${flightPath(flightId)}/track`, TrackView);
}

/** The pilot's review of the flight's phases (spec J3), null when not given yet. */
export function getReview(flightId: string): Promise<FlightReviewView | null> {
  return get(`${flightPath(flightId)}/review`, FlightReviewView);
}

export function saveReview(
  flightId: string,
  review: FlightReview,
): Promise<FlightReviewView | null> {
  return request(`${flightPath(flightId)}/review`, FlightReviewView, {
    method: "PUT",
    body: review,
  });
}
