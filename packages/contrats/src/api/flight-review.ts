import { z } from "zod";
import { UtcTimestamp } from "./common.ts";

/**
 * The pilot's check of a flight's phases (J3 alpha, exit criterion "phases correct on at least 95 %
 * of the flights checked by hand"). `note`: what was wrong, in the pilot's words.
 */
export const FlightReview = z.object({
  phases: z.enum(["correct", "wrong"]),
  note: z.string().trim().max(1000).default(""),
});
export type FlightReview = z.infer<typeof FlightReview>;

/** A review as read back (GET /v1/flights/:id/review); null body fields never happen. */
export const FlightReviewView = FlightReview.extend({ reviewedAt: UtcTimestamp });
export type FlightReviewView = z.infer<typeof FlightReviewView>;
