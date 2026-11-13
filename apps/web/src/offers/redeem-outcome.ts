import type { RedeemResult } from "@weems/contrats";

/** What the code form says after a try (page /code). */
export type RedeemState =
  | { status: "idle" }
  | { status: "done"; result: RedeemResult }
  | { status: "unknown" | "already" | "gone" | "tooMany" | "error" };

/** Shape of an offer code typed by hand: trimmed, upper case. */
export const typedCode = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

/**
 * Meaning of the API's refusal (spec offre fondateurs): 404 unknown code, 409 already used by
 * this pilot (or their own referral code), 410 expired, used or full, 429 too many tries.
 */
export function refusalOf(status: number): RedeemState {
  if (status === 404 || status === 400) return { status: "unknown" };
  if (status === 409) return { status: "already" };
  if (status === 410) return { status: "gone" };
  if (status === 429) return { status: "tooMany" };
  return { status: "error" };
}
