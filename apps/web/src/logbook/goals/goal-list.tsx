import type { GoalView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation.ts";
import { GoalBadge } from "./goal-badge.tsx";
import { GoalRing } from "./goal-ring.tsx";
import { useGoalText } from "./goal-text.ts";
import { shareOf, toneOf } from "./goal-tone.ts";

/** Bar of the goal, with the tick « where you should be today ». */
function GoalBar({ goal }: { goal: GoalView }) {
  const expected = goal.expected === null ? null : Math.min(goal.expected / goal.total, 1);
  return (
    <div className="relative mt-2 h-2 rounded-tag bg-line">
      <div
        className="h-full rounded-tag"
        style={{ width: `${shareOf(goal) * 100}%`, background: toneOf(goal) }}
      />
      {expected !== null && (
        <div className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${expected * 100}%` }} />
      )}
    </div>
  );
}

/** Running goals, each with its ring; the chosen one is shown on the right. */
export function GoalList({
  goals,
  selectedId,
}: {
  goals: readonly GoalView[];
  selectedId: string | null;
}) {
  const t = useTranslations("Logbook.goals");
  const text = useGoalText();
  return (
    <nav
      aria-label={t("running")}
      className="overflow-hidden rounded-panel border border-line bg-surface"
    >
      {goals.map((goal) => {
        const current = goal.goalId === selectedId;
        return (
          <Link
            key={goal.goalId}
            href={{ pathname: "/logbook/goals", query: { g: goal.goalId } }}
            aria-current={current ? "true" : undefined}
            className={`flex items-center gap-3 border-b border-l-4 border-line px-4 py-3.5 last:border-b-0 hover:bg-accent/5 ${current ? "bg-accent/8" : ""}`}
            style={{ borderLeftColor: toneOf(goal) }}
          >
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{text.title(goal)}</div>
              <GoalBar goal={goal} />
              <div className="mt-1.5 text-[12.5px] text-muted">
                {goal.to ? t("until", { date: text.deadline(goal) }) : t("noEnd")}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <GoalRing share={shareOf(goal)} color={toneOf(goal)} />
              <GoalBadge goal={goal} />
            </div>
          </Link>
        );
      })}
      <Link
        href={{ pathname: "/logbook/goals", query: { new: 1 } }}
        className="block px-4 py-3 font-semibold text-link"
      >
        + {t("new")}
      </Link>
    </nav>
  );
}
