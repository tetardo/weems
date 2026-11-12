"use client";

import type { PlanId } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { testPlanAction } from "../plans/test-plan-action.ts";

const CHOICES: readonly { plan: PlanId; label: string }[] = [
  { plan: "pilot_free", label: "Free" },
  { plan: "pilot_pro", label: "Pro" },
];

/**
 * Free | Pro test switch of the bar: changes the plan of the pilot's account through the API, so
 * that every locked card can be tried. Only when the API offers it (outside production); removed
 * before the 1.0. Company and Holding read as Pro here: they include it.
 */
export function TestPlanChoice({ plan }: { plan: PlanId }) {
  const t = useTranslations("Site");
  const [pending, start] = useTransition();
  const current = plan === "pilot_free" ? "pilot_free" : "pilot_pro";
  return (
    <div
      role="group"
      aria-label={t("testPlan")}
      title={t("testPlanHint")}
      className={`flex gap-0.5 rounded-box border border-dashed border-accent-2 p-[3px] ${pending ? "opacity-60" : ""}`}
    >
      {CHOICES.map((choice) => {
        const on = choice.plan === current;
        return (
          <button
            key={choice.plan}
            type="button"
            disabled={pending || on}
            aria-pressed={on}
            onClick={() => start(() => testPlanAction(choice.plan))}
            className={`grid h-9 min-w-9 place-items-center rounded-inner px-2 text-[13px] font-semibold ${
              on ? "bg-surface text-ink shadow-raised" : "text-muted hover:text-ink"
            }`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}
