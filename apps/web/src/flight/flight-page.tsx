import type { FlightReviewView, FlightView, TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { SectionMain } from "../ui/section-main.tsx";
import { EventLogTable } from "./event-log-table.tsx";
import { FlightHeader } from "./flight-header.tsx";
import { FlightTrack } from "./flight-track.tsx";
import { LandingPanel } from "./landing-panel.tsx";
import { PhaseTimelineTable } from "./phase-timeline-table.tsx";
import { ReviewPanel } from "./review-panel.tsx";
import { Section } from "./section.tsx";

/**
 * The flight page (spec site minimal): header, track and profile, phases, landing, log, score;
 * on a closed flight, the pilot's check of the phases (spec J3).
 */
export function FlightPage({
  flight,
  track,
  review,
}: {
  flight: FlightView;
  track: TrackView | null;
  review: FlightReviewView | null;
}) {
  const t = useTranslations("Flight");
  return (
    <SectionMain>
      <Link href="/flights" className="text-sm text-blue-600 hover:underline">
        ← {t("back")}
      </Link>
      <FlightHeader flight={flight} />
      <Section title={t("map.title")}>
        {track && track.points.length > 1 ? (
          <FlightTrack track={track} />
        ) : (
          <p className="text-muted">{t("map.noTrack")}</p>
        )}
      </Section>
      <div className="grid gap-x-6 md:grid-cols-3">
        <PhaseTimelineTable flight={flight} />
        <LandingPanel events={flight.events} />
        <Section title={t("score.title")}>
          <p className="text-muted">{t("score.later")}</p>
        </Section>
      </div>
      {flight.closedAt && <ReviewPanel flightId={flight.flightId} review={review} />}
      <EventLogTable events={flight.events} />
    </SectionMain>
  );
}
