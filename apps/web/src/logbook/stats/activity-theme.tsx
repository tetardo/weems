import type { LogbookStats } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration } from "../../format/flight-format.ts";
import { BarChart } from "../../profile/bar-chart.tsx";
import { CalendarIcon, NightIcon } from "../../ui/icons.ts";
import { KpiTile } from "../kpi-tile.tsx";
import { LogbookCard } from "../logbook-card.tsx";
import { Regularity } from "../summary/regularity.tsx";
import { StatsThemeSection } from "./stats-theme.tsx";

const REGULARITY_WEEKS = 53;
const HALF_BOX = { width: 420, height: 190, top: 20, bottom: 24 };
const WIDE_BOX = { width: 860, height: 190, top: 20, bottom: 24 };
/** Monday 5 January 2026: the weekdays from Monday, named in the language of the page. */
const MONDAY = Date.UTC(2026, 0, 5);
const DAY_FILL = "var(--color-accent)";
const NIGHT_FILL = "var(--color-cat-wide-body)";

const hours = (seconds: number) => Math.round((seconds / 3600) * 10) / 10;
const NONE = "—";

function ActivityKpis({ activity, period }: Pick<LogbookStats, "activity" | "period">) {
  const t = useTranslations("Logbook.stats.activity");
  const { flights, airborneS, flyingDays, averageBlockS, longestBlockS, dayS, nightS } = activity;
  const share = dayS + nightS === 0 ? 0 : Math.round((nightS / (dayS + nightS)) * 100);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiTile
        label={t("hours")}
        value={formatDuration(airborneS) ?? NONE}
        sub={t("flights", { count: flights })}
      />
      <KpiTile label={t("days")} value={String(flyingDays)} sub={t(`over.${period}`)} />
      <KpiTile
        label={t("average")}
        value={formatDuration(averageBlockS) ?? NONE}
        sub={t("longest", { time: formatDuration(longestBlockS) ?? NONE })}
      />
      <KpiTile
        label={t("night")}
        value={formatDuration(nightS) ?? NONE}
        sub={t("nightShare", { share })}
      />
    </div>
  );
}

function MonthsCard({ months }: Pick<LogbookStats, "months">) {
  const t = useTranslations("Logbook.stats.activity");
  const format = useFormatter();
  const values = months.map((m) => hours(m.airborneS));
  return (
    <LogbookCard icon={CalendarIcon} title={t("months")} aside={t("monthsAside")}>
      <BarChart
        values={values}
        shown={values.map((h) => (h > 0 ? `${h} h` : ""))}
        labels={months.map((m) =>
          format.dateTime(new Date(`${m.month}-15T00:00:00Z`), { month: "short", timeZone: "UTC" }),
        )}
        box={HALF_BOX}
        label={t("months")}
      />
    </LogbookCard>
  );
}

function WeekdaysCard({ weekdays }: Pick<LogbookStats, "weekdays">) {
  const t = useTranslations("Logbook.stats.activity");
  const format = useFormatter();
  const values = weekdays.map(hours);
  const day = (i: number) =>
    format.dateTime(new Date(MONDAY + i * 86_400_000), { weekday: "short", timeZone: "UTC" });
  return (
    <LogbookCard icon={CalendarIcon} title={t("weekdays")} aside={t("localTime")}>
      <BarChart
        values={values}
        shown={values.map((h) => (h > 0 ? `${h} h` : ""))}
        labels={values.map((_, i) => day(i))}
        box={HALF_BOX}
        label={t("weekdays")}
      />
    </LogbookCard>
  );
}

function TakeoffCard({ takeoffHours }: Pick<LogbookStats, "takeoffHours">) {
  const t = useTranslations("Logbook.stats.activity");
  const legend = (
    <span className="inline-flex items-center gap-2">
      <i className="inline-block size-2 rounded-full" style={{ background: DAY_FILL }} />
      {t("day")}
      <i className="inline-block size-2 rounded-full" style={{ background: NIGHT_FILL }} />
      {t("nightLegend")}
    </span>
  );
  return (
    <LogbookCard icon={NightIcon} title={t("takeoffs")} aside={legend}>
      <BarChart
        values={takeoffHours.map((h) => h.day + h.night)}
        shown={takeoffHours.map(() => "")}
        labels={takeoffHours.map((_, i) => (i % 3 === 0 ? `${i}h` : ""))}
        colors={takeoffHours.map((h) => (h.night > h.day ? NIGHT_FILL : DAY_FILL))}
        box={WIDE_BOX}
        label={t("takeoffs")}
      />
    </LogbookCard>
  );
}

/** Theme Activité: the four figures, regularity over a year, hours by month and weekday, takeoffs. */
export function ActivityTheme({ stats, today }: { stats: LogbookStats; today: Date }) {
  return (
    <StatsThemeSection id="activity">
      <ActivityKpis activity={stats.activity} period={stats.period} />
      <Regularity flyingDays={stats.regularity} today={today} weeks={REGULARITY_WEEKS} />
      <div className="grid gap-4 lg:grid-cols-2">
        <MonthsCard months={stats.months} />
        <WeekdaysCard weekdays={stats.weekdays} />
      </div>
      <TakeoffCard takeoffHours={stats.takeoffHours} />
    </StatsThemeSection>
  );
}
