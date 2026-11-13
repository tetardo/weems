import { LOGBOOK_STATS_PERIODS, type LogbookStats } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { SegmentLinks } from "../segment-links.tsx";

/** Title of the page Statistiques and the period: « Tout » locked without Pilot Pro. */
export function StatsHeader({ stats }: { stats: LogbookStats }) {
  const t = useTranslations("Logbook.stats");
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="m-0 text-[1.7em]">{t("title")}</h1>
        <p className="m-0 mt-1 text-muted">{t("intro")}</p>
      </div>
      <SegmentLinks
        label={t("periodLabel")}
        segments={LOGBOOK_STATS_PERIODS.map((period) => ({
          key: period,
          href: `/logbook/stats?period=${period}`,
          label: t(`periods.${period}`),
          current: period === stats.period,
          locked: !stats.allowedPeriods.includes(period),
        }))}
      />
    </header>
  );
}
