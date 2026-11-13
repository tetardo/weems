import type { LiveFlight, PublicFlightView, PublicPilot } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { CategoryBadge } from "../aircraft/category-badge.tsx";
import { formatRoute, utcMinutes, utcTime } from "../format/flight-format.ts";
import type { RouteProgress } from "../live/route-progress.ts";
import { LiveTiles } from "./live-tiles.tsx";
import { PilotStrip } from "./pilot-strip.tsx";
import { RouteBar } from "./route-bar.tsx";

/** Callsign and registration, route, aircraft and its category. */
function HeroTitle({ flight }: { flight: PublicFlightView }) {
  const registration = flight.aircraft.registration;
  return (
    <div className="min-w-0">
      <h1 className="m-0 font-title text-[28px] leading-tight">
        {flight.callsign}
        {registration && <span className="text-muted"> · {registration}</span>}
      </h1>
      <p className="m-0 mt-1 flex flex-wrap items-center gap-2 text-[14px] text-muted">
        <span className="font-semibold text-ink">
          {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
        </span>
        · {flight.aircraft.title}
        <CategoryBadge aircraftClass={flight.aircraftClass} />
      </p>
    </div>
  );
}

/** « En direct » with the phase, and when the last position came. */
function OnAir({ flight, live }: { flight: PublicFlightView; live: LiveFlight | undefined }) {
  const t = useTranslations("LiveFlight");
  const phases = useTranslations("Phases");
  const phase = live?.position.phase ?? flight.lastPhase;
  return (
    <div className="text-right">
      <span className="inline-flex items-center gap-2 rounded-full border border-success/50 bg-success/12 px-3 py-1 text-[12.5px] font-bold text-success uppercase">
        <span className="size-2 animate-pulse rounded-full bg-success" aria-hidden="true" />
        {t("onAir")}
        {phase && <span className="font-semibold normal-case"> · {phases(phase)}</span>}
      </span>
      <p className="m-0 mt-1.5 text-[11.5px] text-muted">
        {live ? t("received", { time: utcTime(live.position.at) }) : t("connecting")}
      </p>
    </div>
  );
}

/** Departure with its time, arrival with its estimate, and the bar between them. */
function HeroRoute(props: {
  flight: PublicFlightView;
  vs: number;
  progress: RouteProgress | null;
  etaMs: number | null;
}) {
  const t = useTranslations("LiveFlight");
  const { flight, etaMs } = props;
  const arrival = flight.plannedArrivalIcao;
  const known = arrival !== null && etaMs !== null;
  return (
    <RouteBar
      from={{
        icao: flight.departureIcao ?? "—",
        note: t("departure", { time: utcMinutes(flight.openedAt) }),
      }}
      to={{
        icao: arrival ?? "—",
        note: known
          ? t("arrival", { time: utcMinutes(new Date(etaMs).toISOString()) })
          : t("arrivalUnknown"),
      }}
      fraction={props.progress?.fraction ?? null}
      vs={props.vs}
    />
  );
}

/**
 * Head of the page of a flight in progress: callsign, route and aircraft, the « En direct » pill
 * with the phase, the progress bar, the six figures and the pilot.
 */
export function LiveFlightHero(props: {
  flight: PublicFlightView;
  live: LiveFlight | undefined;
  progress: RouteProgress | null;
  etaMs: number | null;
  pilot: PublicPilot | null;
}) {
  const { flight, live, progress, pilot } = props;
  const position = live?.position;
  return (
    <header className="rounded-panel border border-line bg-surface px-5 py-5 md:px-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <HeroTitle flight={flight} />
        <OnAir flight={flight} live={live} />
      </div>
      <HeroRoute flight={flight} vs={position?.vs ?? 0} progress={progress} etaMs={props.etaMs} />
      {position && (
        <LiveTiles
          position={position}
          elapsedS={Math.max(0, (Date.parse(position.at) - Date.parse(flight.openedAt)) / 1_000)}
          progress={progress}
        />
      )}
      {pilot && <PilotStrip pilot={pilot} />}
    </header>
  );
}
