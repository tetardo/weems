import { DURATION_BUCKETS_H, type PilotCharts, TOUCHDOWN_BUCKETS_FPM } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { BarChart } from "./bar-chart.tsx";
import { TOUCHDOWN_COLORS } from "./chart-geometry.ts";
import { ChartTile } from "./chart-tile.tsx";
import { LandingChart } from "./landing-chart.tsx";
import { TakeoffChart } from "./takeoff-chart.tsx";

/** Narrow chart (a quarter of the width): taller drawing box so that its text stays readable. */
const NARROW = { width: 260, height: 190, top: 20, bottom: 24 };
const HALF = "md:col-span-2";

/** Labels of the duration buckets: "< 1 h", "1–2 h" … "> 8 h". */
const durationLabels = () => {
  const bounds = DURATION_BUCKETS_H;
  return [
    `< ${bounds[0]} h`,
    ...bounds.slice(1).map((b, i) => `${bounds[i]}–${b} h`),
    `> ${bounds.at(-1)} h`,
  ];
};

function useHelp(key: string) {
  const help = useTranslations("Profile.help");
  return { text: help(key), label: help("label") };
}

function ActivityTile({ months }: { months: PilotCharts["months"] }) {
  const t = useTranslations("Profile.charts.activity");
  const format = useFormatter();
  const hours = months.map((m) => Math.round(m.airborneS / 3600));
  const label = (m: string) =>
    format.dateTime(new Date(`${m}-15T00:00:00Z`), { month: "short", timeZone: "UTC" });
  return (
    <ChartTile title={t("title")} subtitle={t("sub")} info={useHelp("activity")} className={HALF}>
      <BarChart
        values={hours}
        shown={hours.map((h) => `${h} h`)}
        labels={months.map((m) => label(m.month))}
        label={t("title")}
      />
    </ChartTile>
  );
}

function TakeoffTile({ takeoffs }: { takeoffs: PilotCharts["takeoffs"] }) {
  const t = useTranslations("Profile.charts.takeoffs");
  return (
    <ChartTile title={t("title")} subtitle={t("sub")} info={useHelp("takeoffs")} className={HALF}>
      <TakeoffChart takeoffs={takeoffs} label={t("title")} />
    </ChartTile>
  );
}

function DurationTile({ durations }: { durations: PilotCharts["durations"] }) {
  const t = useTranslations("Profile.charts.durations");
  return (
    <ChartTile title={t("title")} subtitle={t("sub")}>
      <BarChart values={durations} labels={durationLabels()} box={NARROW} label={t("title")} />
    </ChartTile>
  );
}

function TouchdownTile({ touchdowns }: { touchdowns: PilotCharts["touchdowns"] }) {
  const t = useTranslations("Profile.charts.touchdowns");
  const [soft, normal, firm] = TOUCHDOWN_BUCKETS_FPM;
  return (
    <ChartTile title={t("title")} subtitle={t("sub", { soft, normal, firm })}>
      <BarChart
        values={touchdowns}
        labels={["soft", "normal", "firm", "hard"].map((k) => t(k))}
        colors={TOUCHDOWN_COLORS}
        box={NARROW}
        label={t("title")}
      />
    </ChartTile>
  );
}

function LandingTile({ landings }: { landings: PilotCharts["recentLandings"] }) {
  const t = useTranslations("Profile.charts.landings");
  const texts = {
    label: t("title"),
    oldest: t("oldest"),
    newest: t("newest"),
    average: t("average"),
  };
  return (
    <ChartTile title={t("title")} subtitle={t("sub", { count: landings.length })} className={HALF}>
      <LandingChart landings={landings} texts={texts} />
    </ChartTile>
  );
}

/**
 * Charts at the top of the statistics section (spec J4, Greg's order): activity and takeoff
 * hours, then durations, touchdowns and the landing curve (half the width, on the right).
 */
export function ProfileCharts({ charts }: { charts: PilotCharts }) {
  return (
    <div className="mb-3 grid gap-3 md:grid-cols-4">
      <ActivityTile months={charts.months} />
      <TakeoffTile takeoffs={charts.takeoffs} />
      <DurationTile durations={charts.durations} />
      <TouchdownTile touchdowns={charts.touchdowns} />
      <LandingTile landings={charts.recentLandings} />
    </div>
  );
}
