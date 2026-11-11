import type { PublicFlightView, TrackView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { EventLogTable } from "./event-log-table.tsx";
import { FlightHeader } from "./flight-header.tsx";
import { FlightTrack } from "./flight-track.tsx";
import { LandingPanel } from "./landing-panel.tsx";
import { PhaseTimelineTable } from "./phase-timeline-table.tsx";
import { Section } from "./section.tsx";

/**
 * What every flight page shows (spec site minimal), the pilot's own or a public one (spec J4):
 * header, track and profile, phases, landing, score, log. `beforeLog`: the pilot's review.
 */
export function FlightDetails({
  flight,
  track,
  beforeLog,
}: {
  flight: PublicFlightView;
  track: TrackView | null;
  beforeLog?: ReactNode;
}) {
  const t = useTranslations("Flight");
  return (
    <>
      <FlightHeader flight={flight} />
      <Section title={t("map.title")}>
        {track && track.points.length > 1 ? (
          <FlightTrack track={track} />
        ) : (
          <p className="text-muted">{t("map.noTrack")}</p>
        )}
      </Section>
      <div className="grid gap-x-5 md:grid-cols-3">
        <PhaseTimelineTable flight={flight} />
        <LandingPanel events={flight.events} />
        <Section title={t("score.title")}>
          <p className="text-muted">{t("score.later")}</p>
        </Section>
      </div>
      {beforeLog}
      <EventLogTable events={flight.events} />
    </>
  );
}
