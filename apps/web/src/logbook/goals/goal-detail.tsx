import type { GoalView } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation.ts";
import { PhasesIcon } from "../../ui/icons.ts";
import { archiveGoalAction } from "./goal-actions.ts";
import { GoalBadge } from "./goal-badge.tsx";
import { GoalChart } from "./goal-chart.tsx";
import { GoalFigures } from "./goal-figures.tsx";
import { GoalFlights } from "./goal-flights.tsx";
import { GoalPrevious } from "./goal-previous.tsx";
import { useGoalText } from "./goal-text.ts";

const SMALL = `${buttonClass("outline")} min-h-9 px-3 text-[13px]`;

/** Kind, title, end, badge, and the way to change or set aside the goal. */
function DetailHeader({ goal }: { goal: GoalView }) {
  const t = useTranslations("Logbook.goals");
  const text = useGoalText();
  const { definition } = goal;
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[12.5px] text-muted">
          <PhasesIcon size={14} aria-hidden="true" />
          {t(`kinds.${definition.kind}.label`)}
          {definition.recurring &&
            ` · ${t(`every.${definition.window === "week" ? "week" : "month"}`)}`}
        </div>
        <h2 className="m-0 mt-1 font-title text-[24px] leading-tight">{text.title(goal)}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
          {goal.to ? t("deadline", { date: text.deadline(goal) }) : t("noEnd")}
          <GoalBadge goal={goal} />
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href={{ pathname: "/logbook/goals", query: { g: goal.goalId, edit: 1 } }}
          className={SMALL}
        >
          {t("edit")}
        </Link>
        <form action={archiveGoalAction.bind(null, goal.goalId)}>
          <button type="submit" className={SMALL}>
            {t("archive")}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Suivi of the chosen goal (maquette v12 B, right column). */
export function GoalDetail({ goal, now }: { goal: GoalView; now: number }) {
  const t = useTranslations("Logbook.goals.detail");
  return (
    <section className="rounded-panel border border-line bg-surface px-5 py-4">
      <DetailHeader goal={goal} />
      <GoalFigures goal={goal} />
      <h3 className="mt-5 mb-4 text-[15px]">{t("progress")}</h3>
      <GoalChart goal={goal} now={now} />
      <div className={`mt-5 grid gap-5 ${goal.previous.length > 0 ? "md:grid-cols-2" : ""}`}>
        <div>
          <h3 className="m-0 mb-2 text-[15px]">
            {t("flights")}{" "}
            <span className="text-[12.5px] font-normal text-muted">· {t("lastFive")}</span>
          </h3>
          <GoalFlights goal={goal} />
        </div>
        {goal.previous.length > 0 && (
          <div>
            <h3 className="m-0 mb-2 text-[15px]">
              {t("previous")}{" "}
              <span className="text-[12.5px] font-normal text-muted">· {t("dashed")}</span>
            </h3>
            <GoalPrevious goal={goal} />
          </div>
        )}
      </div>
    </section>
  );
}
