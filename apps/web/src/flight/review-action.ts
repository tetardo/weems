"use server";

import { FlightReview, type FlightReviewView } from "@weems/contrats";
import { saveReview } from "../api/weems-api.ts";

export type ReviewState =
  | { status: "idle" | "saved"; review: FlightReviewView | null }
  | { status: "error"; review: FlightReviewView | null };

/** Form action of the review card: sends the pilot's answer to the API. */
export async function submitReview(
  flightId: string,
  previous: ReviewState,
  form: FormData,
): Promise<ReviewState> {
  const review = FlightReview.safeParse({
    phases: form.get("phases"),
    note: form.get("note") ?? "",
  });
  if (!review.success) return { status: "error", review: previous.review };
  try {
    const saved = await saveReview(flightId, review.data);
    return saved
      ? { status: "saved", review: saved }
      : { status: "error", review: previous.review };
  } catch {
    return { status: "error", review: previous.review };
  }
}
