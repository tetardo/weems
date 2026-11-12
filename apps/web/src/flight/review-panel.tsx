"use client";

import type { FlightReviewView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, INPUT_CLASS } from "@weems/ui";
import { type ReviewState, submitReview } from "./review-action.ts";
import { Section } from "./section.tsx";

const NOTE_CLASS = `${INPUT_CLASS} min-h-24`;

/** Yes / no, ticked with the previous answer. */
function PhasesChoice({ current }: { current: FlightReviewView | null }) {
  const t = useTranslations("Flight.review");
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {(["correct", "wrong"] as const).map((value) => (
        <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2">
          <input
            className="size-5 accent-accent"
            type="radio"
            name="phases"
            value={value}
            required
            defaultChecked={current?.phases === value}
          />
          {t(value)}
        </label>
      ))}
    </div>
  );
}

/**
 * "Are the phases right?" (spec J3): the alpha's exit criterion counts the flights whose phases
 * the pilot found right. Shown on closed flights only.
 */
export function ReviewPanel({
  flightId,
  review,
}: {
  flightId: string;
  review: FlightReviewView | null;
}) {
  const t = useTranslations("Flight.review");
  const [state, action, pending] = useActionState<ReviewState, FormData>(
    submitReview.bind(null, flightId),
    { status: "idle", review },
  );
  const current = state.review;
  return (
    <Section title={t("title")}>
      <form action={action} className="space-y-4">
        <p>{t("question")}</p>
        <PhasesChoice current={current} />
        <label className="block">
          <span className="mb-2 block text-sm text-muted">{t("note")}</span>
          <textarea
            name="note"
            maxLength={1000}
            rows={3}
            defaultValue={current?.note ?? ""}
            className={NOTE_CLASS}
          />
        </label>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={pending}>
            {t("send")}
          </Button>
          <span role="status" className="text-sm text-muted">
            {state.status === "saved" && t("saved")}
            {state.status === "error" && t("error")}
            {state.status === "idle" && current && t("already")}
          </span>
        </div>
      </form>
    </Section>
  );
}
