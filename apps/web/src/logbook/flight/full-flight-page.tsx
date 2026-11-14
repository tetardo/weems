import { useTranslations } from "next-intl";
import { ReviewForm } from "../../flight/review-form.tsx";
import { DoneIcon, StatsIcon } from "../../ui/icons.ts";
import { CardGroup } from "../card-group.tsx";
import { LogbookCard } from "../logbook-card.tsx";
import { EcamBands } from "../ecam/ecam-bands.tsx";
import { FlightBands } from "../flights/flight-bands.tsx";
import { ApproachCard } from "./approach-card.tsx";
import { ComparisonCard } from "./comparison-card.tsx";
import { FlightOverview } from "./flight-overview.tsx";
import { FullFlightHeader } from "./full-flight-header.tsx";
import { FullFlightTop } from "./full-flight-top.tsx";
import { JournalCard } from "./journal-card.tsx";
import { LandingCard } from "./landing-card.tsx";
import { landingDetails } from "./landing-details.ts";
import type { FullFlight } from "./load-full-flight.ts";
import { PhasesCard } from "./phases-card.tsx";

const PAIR = "grid items-stretch gap-4 md:grid-cols-2";

/**
 * Full page of a flight in the logbook (maquette v13, A, one column, Greg 13/11): header, overview
 * (map, phases, profile), flight bands, landing, then the log and the check of the phases.
 */
export function FullFlightPage({ data }: { data: FullFlight }) {
  const t = useTranslations("Logbook.flight");
  const { flight, points, bands } = data;
  const landing = landingDetails(flight.events, points, bands);
  return (
    <div className="grid gap-4">
      <FullFlightTop data={data} />
      <FullFlightHeader data={data} />
      <CardGroup title={t("groups.overview")}>
        <FlightOverview points={points} phases={<PhasesCard flight={flight} />} />
      </CardGroup>
      <CardGroup title={t("groups.bands")}>
        <LogbookCard icon={StatsIcon} title={t("bands")}>
          {bands ? (
            <>
              <EcamBands bands={bands} />
              <div className="mt-5">
                <FlightBands bands={bands} />
              </div>
            </>
          ) : (
            <p className="m-0 text-[13px] text-muted">{t("noTrack")}</p>
          )}
        </LogbookCard>
      </CardGroup>
      <CardGroup title={t("groups.landing")}>
        <div className={PAIR}>
          <LandingCard landing={landing} arrival={flight.plannedArrivalIcao} />
          <ApproachCard points={points} touchdownAt={landing?.at ?? null} />
        </div>
        <ComparisonCard comparison={data.comparison} locked={data.compareLocked} />
      </CardGroup>
      <CardGroup title={t("groups.logbook")}>
        <div className={PAIR}>
          <JournalCard events={flight.events} />
          <LogbookCard icon={DoneIcon} title={t("review")} className="h-full">
            <ReviewForm flightId={flight.flightId} review={data.review} />
          </LogbookCard>
        </div>
      </CardGroup>
    </div>
  );
}
