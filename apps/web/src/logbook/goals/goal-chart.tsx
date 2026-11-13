import type { GoalView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { CHART_SIZE, type GoalChartShape, goalChartShape } from "./goal-chart-geometry.ts";
import { useGoalText } from "./goal-text.ts";

const LINE = { fill: "none", vectorEffect: "non-scaling-stroke" } as const;
const DAYS = [0, 0.25, 0.5, 0.75, 1];
const gridPath = ({ ticks, top }: GoalChartShape, height: number) =>
  ticks.map((tick) => `M0,${(1 - tick / top) * height}H${CHART_SIZE.width}`).join("");

/** What each line is. */
function ChartLegend({ pace, projection }: { pace: boolean; projection: boolean }) {
  const t = useTranslations("Logbook.goals.chart");
  return (
    <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
      <span className="flex items-center gap-1.5">
        <span className="h-0.5 w-4 bg-accent" />
        {t("value")}
      </span>
      {pace && (
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t border-dashed border-muted" />
          {t("pace")}
        </span>
      )}
      {projection && (
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dotted border-accent" />
          {t("projection")}
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-0.5 bg-accent-2" />
        {t("today")}
      </span>
    </figcaption>
  );
}

/** Grid, steady pace, steps, projection and today, stretched to the box. */
function ChartLines({ shape, label }: { shape: GoalChartShape; label: string }) {
  const { width: W, height: H } = CHART_SIZE;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className="block size-full overflow-visible"
    >
      <path d={gridPath(shape, H)} className="stroke-line" {...LINE} />
      {shape.pace && (
        <path
          d={shape.pace}
          className="stroke-muted"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          {...LINE}
        />
      )}
      <path d={shape.steps} className="stroke-accent" strokeWidth={2.5} {...LINE} />
      {shape.projection && (
        <path
          d={shape.projection}
          className="stroke-accent"
          strokeDasharray="2 4"
          strokeWidth={2}
          {...LINE}
        />
      )}
      <line
        x1={shape.todayX}
        x2={shape.todayX}
        y1={0}
        y2={H}
        className="stroke-accent-2"
        strokeWidth={1.5}
        {...LINE}
      />
    </svg>
  );
}

/** « Progression »: the goal's value flight after flight against the steady pace (fills its box). */
export function GoalChart({ goal, now }: { goal: GoalView; now: number }) {
  const t = useTranslations("Logbook.goals.chart");
  const text = useGoalText();
  const shape = goalChartShape(goal, now);
  const at = (share: number) =>
    new Date(shape.from + share * (shape.to - shape.from)).toISOString();
  return (
    <figure className="m-0">
      <div className="relative ml-12 h-56">
        {shape.ticks.map((tick) => (
          <span
            key={tick}
            className="absolute -left-12 w-10 -translate-y-1/2 text-right text-[11px] text-muted"
            style={{ top: `${(1 - tick / shape.top) * 100}%` }}
          >
            {text.value(goal.definition.kind, tick)}
          </span>
        ))}
        <ChartLines shape={shape} label={t("label")} />
      </div>
      <div className="mt-1 ml-12 flex justify-between text-[11px] text-muted">
        {DAYS.map((share) => (
          <span key={share}>{text.day(at(share))}</span>
        ))}
      </div>
      <ChartLegend pace={shape.pace !== null} projection={shape.projection !== null} />
    </figure>
  );
}
