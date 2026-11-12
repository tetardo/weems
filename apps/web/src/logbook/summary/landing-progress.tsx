import type { LogbookSummary } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { LandingChart } from "../../profile/landing-chart.tsx";
import { StatsIcon } from "../../ui/icons.ts";
import { SummaryCard } from "./summary-card.tsx";

/** « Progression des touchers »: the last 30 touchdowns and their moving average over 5. */
export function LandingProgress({ landings }: { landings: LogbookSummary["recentLandings"] }) {
  const t = useTranslations("Logbook.summary.landings");
  return (
    <SummaryCard icon={StatsIcon} title={t("title")} aside={t("aside")}>
      {landings.length < 2 ? (
        <p className="m-0 text-[13px] text-muted">{t("empty")}</p>
      ) : (
        <LandingChart
          landings={landings}
          texts={{
            label: t("title"),
            oldest: t("oldest"),
            newest: t("newest", { count: landings.length }),
            average: t("average"),
          }}
        />
      )}
    </SummaryCard>
  );
}
