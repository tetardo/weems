import { type LogbookStats, TOUCHDOWN_BUCKETS_FPM } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { BarChart } from "../../profile/bar-chart.tsx";
import { TOUCHDOWN_COLORS } from "../../profile/chart-geometry.ts";
import { LandingChart } from "../../profile/landing-chart.tsx";
import { AnalysisIcon, ArrivalIcon, StatsIcon } from "../../ui/icons.ts";
import { LockedCard } from "../locked-card.tsx";
import { LogbookCard } from "../logbook-card.tsx";
import { TouchdownValue } from "../touchdown-value.tsx";
import { StatsThemeSection } from "./stats-theme.tsx";
import { useCategoryName } from "./use-category-name.ts";

const BOX = { width: 420, height: 190, top: 20, bottom: 24 };

function DistributionCard({ landings }: Pick<LogbookStats, "landings">) {
  const t = useTranslations("Logbook.stats.landings");
  const [soft, normal, firm] = TOUCHDOWN_BUCKETS_FPM;
  const clean = landings.landed === 0 ? 0 : Math.round((landings.clean / landings.landed) * 100);
  return (
    <LogbookCard
      icon={ArrivalIcon}
      title={t("distribution")}
      aside={t("distributionAside", { count: landings.landed, clean })}
    >
      <BarChart
        values={landings.buckets}
        labels={[`< ${soft}`, `${soft}–${normal}`, `${normal}–${firm}`, `> ${firm}`]}
        colors={TOUCHDOWN_COLORS}
        box={BOX}
        label={t("distribution")}
      />
    </LogbookCard>
  );
}

function RecentCard({ landings }: Pick<LogbookStats, "landings">) {
  const t = useTranslations("Logbook.summary.landings");
  const own = useTranslations("Logbook.stats.landings");
  return (
    <LogbookCard icon={StatsIcon} title={own("recent")} aside={own("recentAside")}>
      {landings.recent.length < 2 ? (
        <p className="m-0 text-[13px] text-muted">{t("empty")}</p>
      ) : (
        <LandingChart
          landings={landings.recent}
          texts={{
            label: own("recent"),
            oldest: t("oldest"),
            newest: t("newest", { count: landings.recent.length }),
            average: t("average"),
          }}
        />
      )}
    </LogbookCard>
  );
}

type Trend = NonNullable<LogbookStats["categoryTrends"]>[number];

function TrendRow({ trend }: { trend: Trend }) {
  const t = useTranslations("Logbook.stats.landings");
  const format = useFormatter();
  const name = useCategoryName();
  const signed = (n: number) =>
    format.number(n, { signDisplay: "exceptZero", maximumFractionDigits: 0 });
  return (
    <tr className="border-t border-line">
      <td className="py-2 pr-2">{name(trend.category)}</td>
      <td className="py-2">
        {trend.touchdownAverage === null ? "—" : <TouchdownValue vs={trend.touchdownAverage} />}
      </td>
      <td className="py-2">
        {trend.trendFpm === null ? (
          <span className="text-[12.5px] text-muted">{t("fewFlights")}</span>
        ) : (
          <span className={trend.trendFpm >= 0 ? "text-success" : "text-accent-2"}>
            {t("trendValue", { value: signed(trend.trendFpm) })}
          </span>
        )}
      </td>
      <td className="py-2 text-right tabular-nums">
        {trend.bounceShare === null ? "—" : format.number(trend.bounceShare, { style: "percent" })}
      </td>
    </tr>
  );
}

function TrendsCard({ trends }: { trends: LogbookStats["categoryTrends"] }) {
  const t = useTranslations("Logbook.stats.landings");
  return (
    <LogbookCard icon={AnalysisIcon} title={t("byCategory")}>
      {trends === null ? (
        <LockedCard title={t("lockedTitle")} text={t("lockedText")} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[13.5px]">
            <thead>
              <tr className="text-left text-[12px] text-muted">
                {["category", "average", "trend"].map((key) => (
                  <th key={key} className="pb-1.5 font-normal">
                    {t(`columns.${key}`)}
                  </th>
                ))}
                <th className="pb-1.5 text-right font-normal">{t("columns.bounces")}</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((trend) => (
                <TrendRow key={trend.category ?? "none"} trend={trend} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LogbookCard>
  );
}

/** Theme Atterrissages: touchdowns by bucket, the last 30, and by aircraft category (Pilot Pro). */
export function LandingsTheme({ stats }: { stats: LogbookStats }) {
  return (
    <StatsThemeSection id="landings">
      <div className="grid gap-4 lg:grid-cols-2">
        <DistributionCard landings={stats.landings} />
        <RecentCard landings={stats.landings} />
      </div>
      <TrendsCard trends={stats.categoryTrends} />
    </StatsThemeSection>
  );
}
