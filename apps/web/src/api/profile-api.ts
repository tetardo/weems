import { FlightVisibility, HiddenFlights, MyProfile, type ProfileUpdate } from "@weems/contrats";
import { z } from "zod";
import { apiRequest } from "./api-request.ts";

/** The pilot's own public profile settings (spec J4 profil public). */

export async function getMyProfile(): Promise<MyProfile | null> {
  return apiRequest("/v1/me/profile", MyProfile);
}

/** Throws ApiRefused: 400 (malformed), 409 (handle taken), 422 (reserved, or no handle). */
export async function saveMyProfile(update: ProfileUpdate): Promise<MyProfile | null> {
  return apiRequest("/v1/me/profile", MyProfile, { method: "PUT", body: update });
}

export async function deleteMyPhoto(): Promise<void> {
  await apiRequest("/v1/me/profile/photo", z.null(), { method: "DELETE" });
}

export async function getHiddenFlights(): Promise<HiddenFlights> {
  return (await apiRequest("/v1/me/profile/hidden-flights", HiddenFlights)) ?? { flights: [] };
}

const visibilityPath = (flightId: string) =>
  `/v1/flights/${encodeURIComponent(flightId)}/visibility`;

export function getVisibility(flightId: string): Promise<FlightVisibility | null> {
  return apiRequest(visibilityPath(flightId), FlightVisibility);
}

export function setVisibility(
  flightId: string,
  visibility: FlightVisibility,
): Promise<FlightVisibility | null> {
  return apiRequest(visibilityPath(flightId), FlightVisibility, {
    method: "PUT",
    body: visibility,
  });
}
