import type { GoalView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useGoalText } from "./goal-text.ts";

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-box border border-line px-3 py-2 first:bg-accent/8">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="text-[18px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/** Fait, Reste, Attendu ce jour, Rythme utile, Vols, Projection (« — » when it has no sense). */
export function GoalFigures({ goal }: { goal: GoalView }) {
  const t = useTranslations("Logbook.goals.figures");
  const text = useGoalText();
  const { kind } = goal.definition;
  const none = "—";
  const left = Math.max(goal.total - goal.value, 0);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Figure label={t("done")} value={text.value(kind, goal.value)} />
      <Figure label={t("left")} value={text.value(kind, left)} />
      <Figure
        label={t("expected")}
        value={goal.expected === null ? none : text.value(kind, goal.expected)}
      />
      <Figure
        label={t("perWeek")}
        value={
          goal.perWeekNeeded === null
            ? none
            : t("weekly", { value: text.value(kind, goal.perWeekNeeded) })
        }
      />
      <Figure label={t("flights")} value={String(goal.flights)} />
      <Figure label={t("projection")} value={goal.projection ? text.day(goal.projection) : none} />
    </div>
  );
}
