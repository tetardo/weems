import type { GoalKind, GoalView } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { useGoalText } from "./goal-text.ts";

interface Bar {
  from: string;
  value: number;
  total: number;
  reached: boolean;
  current?: boolean;
}

/** One period: its bar, the target dashed across, its value, its name and how it ended. */
function PeriodBar({
  period,
  top,
  label,
  kind,
}: {
  period: Bar;
  top: number;
  label: string;
  kind: GoalKind;
}) {
  const t = useTranslations("Logbook.goals.detail");
  const text = useGoalText();
  const current = period.current === true;
  const tone = current ? "bg-accent/45" : period.reached ? "bg-success" : "bg-accent-2";
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
      <div className="relative flex w-full flex-1 items-end justify-center">
        <div
          className="absolute inset-x-0 border-t border-dashed border-ink"
          style={{ bottom: `${(100 * period.total) / top}%` }}
        />
        <div
          className={`w-3/5 rounded-t-inner ${tone}`}
          style={{ height: `${(100 * period.value) / top}%` }}
        />
      </div>
      <span className="mt-1 text-[11.5px] font-semibold tabular-nums">
        {text.value(kind, period.value)}
      </span>
      <span className="text-[11px] text-muted">{label}</span>
      <span
        className={`text-[11px] ${current ? "text-muted" : period.reached ? "text-success" : "text-accent-2"}`}
      >
        {current ? t("running") : period.reached ? t("reached") : t("missed")}
      </span>
    </div>
  );
}

/** « Périodes précédentes » of a goal that starts again: one bar each, the target dashed. */
export function GoalPrevious({ goal }: { goal: GoalView }) {
  const text = useGoalText();
  const format = useFormatter();
  const periods = [
    ...goal.previous,
    {
      from: goal.from,
      to: goal.to ?? goal.from,
      value: goal.value,
      total: goal.total,
      reached: false,
      current: true,
    },
  ];
  const top = Math.max(...periods.flatMap((p) => [p.value, p.total])) * 1.1 || 1;
  const label = (iso: string) =>
    goal.definition.window === "month"
      ? format.dateTime(new Date(iso), { month: "short", timeZone: "UTC" })
      : text.day(iso);
  return (
    <div className="flex h-48 items-end gap-3">
      {periods.map((period) => (
        <PeriodBar
          key={period.from}
          period={period}
          top={top}
          label={label(period.from)}
          kind={goal.definition.kind}
        />
      ))}
    </div>
  );
}
