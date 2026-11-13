import type { LogbookSummary, MyRank, TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { LandingProgress } from "./landing-progress.tsx";
import { LastFlightCard } from "./last-flight-card.tsx";
import { RankCard } from "./rank-card.tsx";
import { RankPromotion } from "./rank-promotion.tsx";
import { RecentFlights } from "./recent-flights.tsx";
import { Regularity } from "./regularity.tsx";
import { SummaryKpis } from "./summary-kpis.tsx";
import { WorkOnCard } from "./work-on.tsx";

interface Props {
  summary: LogbookSummary;
  /** Rank of the pilot (spec grades des pilotes); null when the API did not answer. */
  rank: MyRank | null;
  /** Trajectory of the last flight, empty when it has none. */
  points: TrackView["points"];
  /** The plan includes the detailed analysis of the approaches (key workOnDetailed). */
  detailed: boolean;
  today: Date;
}

/**
 * Page Résumé of the private logbook (maquette v6): last flight on the whole width, the four
 * figures, the rank, then progress and regularity beside « À travailler », then the recent flights.
 */
export function SummaryPage({ summary, rank, points, detailed, today }: Props) {
  const t = useTranslations("Logbook.summary");
  return (
    <div className="grid gap-4">
      <h1 className="sr-only">{t("title")}</h1>
      {summary.lastFlight ? (
        <LastFlightCard last={summary.lastFlight} points={points} now={today} />
      ) : (
        <p className="m-0 rounded-panel border border-line bg-surface px-5 py-4 text-muted">
          {t("empty")}
        </p>
      )}
      <SummaryKpis summary={summary} />
      {rank && <RankCard rank={rank} />}
      {rank && <RankPromotion rank={rank.rank} reachedAt={rank.reachedAt} />}
      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4">
          <LandingProgress landings={summary.recentLandings} />
          <Regularity flyingDays={summary.flyingDays} today={today} />
        </div>
        <WorkOnCard workOn={summary.workOn} detailed={detailed} />
      </div>
      {summary.recentFlights.length > 0 && <RecentFlights flights={summary.recentFlights} />}
    </div>
  );
}
