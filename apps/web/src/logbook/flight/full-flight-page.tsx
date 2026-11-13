import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ReviewForm } from "../../flight/review-form.tsx";
import { DoneIcon, StatsIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";
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

/** Title of a group of cards (« Vue d'ensemble », « Atterrissage »…). */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4">
      <h2 className="m-0 mt-2 text-[11px] font-bold tracking-[.08em] text-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

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
      <Group title={t("groups.overview")}>
        <FlightOverview points={points} phases={<PhasesCard flight={flight} />} />
      </Group>
      <Group title={t("groups.bands")}>
        <LogbookCard icon={StatsIcon} title={t("bands")}>
          {bands ? (
            <FlightBands bands={bands} />
          ) : (
            <p className="m-0 text-[13px] text-muted">{t("noTrack")}</p>
          )}
        </LogbookCard>
      </Group>
      <Group title={t("groups.landing")}>
        <div className={PAIR}>
          <LandingCard landing={landing} arrival={flight.plannedArrivalIcao} />
          <ApproachCard points={points} touchdownAt={landing?.at ?? null} />
        </div>
        <ComparisonCard comparison={data.comparison} locked={data.compareLocked} />
      </Group>
      <Group title={t("groups.logbook")}>
        <div className={PAIR}>
          <JournalCard events={flight.events} />
          <LogbookCard icon={DoneIcon} title={t("review")} className="h-full">
            <ReviewForm flightId={flight.flightId} review={data.review} />
          </LogbookCard>
        </div>
      </Group>
    </div>
  );
}
