import {
  type FlightReview,
  FlightList,
  FlightReviewView,
  FlightView,
  TrackView,
} from "@weems/contrats";
import { redirect } from "next/navigation";
import { z } from "zod";
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

type Write = { method: "PUT" | "DELETE"; body?: unknown };

/** Fetch options of a request: GET by default, JSON body when there is one. */
async function requestInit(write?: Write): Promise<RequestInit> {
  const headers: Record<string, string> = { cookie: await forwardedCookies() };
  const body = write?.body === undefined ? null : JSON.stringify(write.body);
  if (body !== null) headers["content-type"] = "application/json";
  return { method: write?.method ?? "GET", headers, body, cache: "no-store" };
}

/**
 * A request to the API from the site's server, as the logged-in pilot (session cookie forwarded).
 * Null when the resource does not exist or is another pilot's (404); expired session → login page.
 */
async function request<T extends z.ZodType>(
  path: string,
  schema: T,
  write?: Write,
): Promise<z.infer<T> | null> {
  const url = serverApiUrl();
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, await requestInit(write));
  } catch (error) {
    throw new ApiUnavailable(url, error);
  }
  if (response.status === 401) redirect("/login");
  if (response.status === 404) return null;
  if (!response.ok) throw new ApiUnavailable(url, new Error(`HTTP ${response.status}`));
  // 204 No Content (a deletion): nothing to read.
  return schema.parse(response.status === 204 ? null : await response.json());
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

/** Development only: deletes all the pilot's flights (the API refuses it in production). */
export async function deleteAllFlights(): Promise<void> {
  await request("/v1/flights", z.null(), { method: "DELETE" });
}
