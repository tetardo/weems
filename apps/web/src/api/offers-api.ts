import {
  MyCodes,
  MyFounder,
  PublicAmbassador,
  PublicFounders,
  RedeemResult,
} from "@weems/contrats";
import { hasSession } from "../auth/server-session.ts";
import { apiRequest } from "./api-request.ts";

/** Founder offer, offer codes and ambassadors (spec offre fondateurs). */

/** Public state of the founder offer (page Offres); null when the API does not answer. */
export async function getPublicFounders(): Promise<PublicFounders | null> {
  try {
    return await apiRequest("/v1/founders", PublicFounders, { anonymous: true });
  } catch {
    return null;
  }
}

/** The logged-in pilot's progress towards a founder place; null for a visitor. */
export async function getMyFounder(): Promise<MyFounder | null> {
  if (!(await hasSession())) return null;
  return apiRequest("/v1/me/founder", MyFounder);
}

/** The logged-in pilot's referral codes. */
export function getMyCodes(): Promise<MyCodes | null> {
  return apiRequest("/v1/me/codes", MyCodes);
}

/** Uses an offer code for the logged-in pilot; refusals come back as ApiRefused (404, 409, 410, 429). */
export function redeemCode(code: string): Promise<RedeemResult | null> {
  return apiRequest("/v1/me/codes/redeem", RedeemResult, { method: "POST", body: { code } });
}

/** An ambassador's public page; null when unknown or turned off. */
export function getAmbassador(slug: string): Promise<PublicAmbassador | null> {
  return apiRequest(`/v1/ambassadors/${encodeURIComponent(slug)}`, PublicAmbassador, {
    anonymous: true,
  });
}
