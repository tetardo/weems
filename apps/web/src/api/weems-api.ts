import { type FlightReview, FlightReviewView, FlightView, TrackView } from "@weems/contrats";
import { z } from "zod";
import { apiRequest } from "./api-request.ts";

const get = <T extends z.ZodType>(path: string, schema: T) => apiRequest(path, schema);
const flightPath = (flightId: string) => `/v1/flights/${encodeURIComponent(flightId)}`;

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
  return apiRequest(`${flightPath(flightId)}/review`, FlightReviewView, {
    method: "PUT",
    body: review,
  });
}

/** Development only: deletes all the pilot's flights (the API refuses it in production). */
export async function deleteAllFlights(): Promise<void> {
  await apiRequest("/v1/flights", z.null(), { method: "DELETE" });
}
