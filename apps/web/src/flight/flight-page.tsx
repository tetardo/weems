import type { FlightView, TrackView } from "@weems/contrats";
import { mdiArrowLeft } from "@mdi/js";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { buttonClass } from "../ui/button.tsx";
import { Icon } from "../ui/icon.tsx";
import { SectionMain } from "../ui/section-main.tsx";
import { EventLogTable } from "./event-log-table.tsx";
import { FlightHeader } from "./flight-header.tsx";
import { FlightTrack } from "./flight-track.tsx";
import { LandingPanel } from "./landing-panel.tsx";
import { PhaseTimelineTable } from "./phase-timeline-table.tsx";
import { Section } from "./section.tsx";

/** The flight page (spec site minimal): header, track and profile, phases, landing, log, score. */
export function FlightPage({ flight, track }: { flight: FlightView; track: TrackView | null }) {
  const t = useTranslations("Flight");
  return (
    <SectionMain>
      <Link href="/flights" className={`${buttonClass("ghost")} -ml-3 text-link`}>
        <Icon path={mdiArrowLeft} size={20} />
        {t("back")}
      </Link>
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
      <EventLogTable events={flight.events} />
    </SectionMain>
  );
}
