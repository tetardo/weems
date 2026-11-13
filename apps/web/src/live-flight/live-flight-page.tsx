"use client";

import type { PublicFlightView, PublicPilot } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { VerticalProfile } from "../flight/vertical-profile.tsx";
import { CardGroup } from "../logbook/card-group.tsx";
import { JournalCard } from "../logbook/flight/journal-card.tsx";
import { LogbookCard } from "../logbook/logbook-card.tsx";
import { FlightBands } from "../logbook/flights/flight-bands.tsx";
import { MapIcon, StatsIcon } from "../ui/icons.ts";
import { SectionMain } from "../ui/section-main.tsx";
import { LiveFlightHero } from "./live-flight-hero.tsx";
import { LiveFlightMap } from "./live-flight-map.tsx";
import { LiveFlightTop } from "./live-flight-top.tsx";
import { LivePhases } from "./live-phases.tsx";
import { type LiveFlightView, useLiveFlightView } from "./use-live-flight-view.ts";

/** Before the first points of the flight. */
function Waiting() {
  const t = useTranslations("LiveFlight.sections");
  return <p className="m-0 text-[13px] text-muted">{t("waiting")}</p>;
}

/** Four bands only in flight (Greg, 13/11): phase, altitude, speed, vertical speed. */
function BandsCard({ view }: { view: LiveFlightView }) {
  const t = useTranslations("LiveFlight.sections");
  return (
    <LogbookCard icon={StatsIcon} title={t("bands")} aside={t("bandsAside")}>
      {view.bands.minutes.length > 0 ? (
        <FlightBands bands={view.bands} withMarks={false} />
      ) : (
        <Waiting />
      )}
      <p className="m-0 mt-2 text-[12px] text-muted">{t("bandsNote")}</p>
    </LogbookCard>
  );
}

/** The fixed map, and the phases with the estimated arrival beside it. */
function MapAndPhases({ flight, view }: { flight: PublicFlightView; view: LiveFlightView }) {
  const t = useTranslations("LiveFlight.sections");
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <LogbookCard icon={MapIcon} title={t("map")} aside={t("mapAside")} className="flex flex-col">
        <LiveFlightMap
          flightId={flight.flightId}
          callsign={flight.callsign}
          position={view.position}
          flights={view.flights}
          route={view.route}
          allRoutes={view.allRoutes}
          overlays={view.overlays}
          detail={view.detail}
        />
      </LogbookCard>
      <LivePhases
        events={flight.events}
        current={view.position?.phase ?? flight.lastPhase ?? "BOARDING"}
        etaMs={view.etaMs}
        remainingMinutes={view.progress?.remainingMinutes ?? null}
      />
    </div>
  );
}

/** The altitude profile, filled as the flight goes. */
function ProfileCard({ view }: { view: LiveFlightView }) {
  const t = useTranslations("LiveFlight.sections");
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <LogbookCard icon={StatsIcon} title={t("profile")} aside={t("profileAside")}>
      {view.points.length > 1 ? (
        <VerticalProfile points={view.points} selected={selected} onSelect={setSelected} />
      ) : (
        <Waiting />
      )}
    </LogbookCard>
  );
}

/**
 * Page of a flight in progress (spec vol en cours, Greg 13/11/2026), at the address of the flight
 * page: everything follows the live stream; once the flight is closed the server shows the full
 * page. Order: top, head, then « En direct »: bands, map and phases, profile, journal.
 */
export function LiveFlightPage({
  apiUrl,
  handle,
  flight,
  pilot,
}: {
  apiUrl: string;
  handle: string;
  flight: PublicFlightView;
  pilot: PublicPilot | null;
}) {
  const t = useTranslations("LiveFlight");
  const view = useLiveFlightView(apiUrl, flight.flightId);
  return (
    <SectionMain>
      <LiveFlightTop
        handle={handle}
        name={pilot?.name ?? handle}
        flightId={flight.flightId}
        callsign={flight.callsign}
      />
      <div className="grid gap-4">
        <LiveFlightHero
          flight={flight}
          live={view.flight}
          progress={view.progress}
          etaMs={view.etaMs}
          pilot={pilot}
        />
        {view.silent && (
          <p className="m-0 rounded-box border border-accent-2/50 bg-accent-2/10 px-4 py-3 text-[13.5px]">
            {t("silent")}
          </p>
        )}
        <CardGroup title={t("sections.live")}>
          <BandsCard view={view} />
          <MapAndPhases flight={flight} view={view} />
          <ProfileCard view={view} />
          <JournalCard events={flight.events} />
        </CardGroup>
      </div>
    </SectionMain>
  );
}
