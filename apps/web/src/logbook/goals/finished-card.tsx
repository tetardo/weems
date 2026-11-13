import type { GoalView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { DoneIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";
import { useGoalText } from "./goal-text.ts";

const DOTS: Record<GoalView["status"], string> = {
  achieved: "bg-success",
  missed: "bg-accent-2",
  archived: "bg-line",
  active: "bg-accent",
};

/** « Atteints et terminés »: reached, missed and set-aside goals, the last first. */
export function FinishedCard({ goals }: { goals: readonly GoalView[] }) {
  const t = useTranslations("Logbook.goals.finished");
  const text = useGoalText();
  const reached = goals.filter((goal) => goal.status === "achieved").length;
  return (
    <LogbookCard
      icon={DoneIcon}
      title={t("title")}
      aside={goals.length > 0 && t("count", { reached, count: goals.length })}
      className="h-full"
    >
      {goals.length === 0 ? (
        <p className="m-0 text-[13px] text-muted">{t("none")}</p>
      ) : (
        <ol className="m-0 grid list-none gap-3 p-0">
          {goals.map((goal) => (
            <li
              key={goal.goalId}
              className="grid grid-cols-[4.5em_10px_minmax(0,1fr)] items-start gap-x-2.5"
            >
              <span className="text-[12.5px] text-muted tabular-nums">
                {text.day(goal.finishedAt ?? goal.createdAt)}
              </span>
              <span className={`mt-1.5 size-2.5 rounded-full ${DOTS[goal.status]}`} />
              <span>
                <span className="block text-[14px] font-semibold">{text.title(goal)}</span>
                <span className="block text-[12.5px] text-muted">
                  {t(goal.status, {
                    value: text.value(goal.definition.kind, goal.value),
                    total: text.value(goal.definition.kind, goal.total),
                  })}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </LogbookCard>
  );
}
