import type { GoalView } from "@weems/contrats";
import { useTranslations } from "next-intl";

/** En avance / En retard, the record of a streak, or nothing. */
export function GoalBadge({ goal }: { goal: GoalView }) {
  const t = useTranslations("Logbook.goals.badges");
  if (goal.pace) {
    const ahead = goal.pace === "ahead";
    return (
      <span
        className={`rounded-tag px-1.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap ${ahead ? "bg-success/12 text-success" : "bg-accent-2/14 text-accent-2"}`}
      >
        {t(goal.pace)}
      </span>
    );
  }
  if (goal.record !== null)
    return (
      <span className="rounded-tag bg-line px-1.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap">
        {t("record", { record: goal.record })}
      </span>
    );
  return null;
}
