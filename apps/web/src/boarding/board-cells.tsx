"use client";

import type { BoardingFlight, BoardingStatus } from "@weems/contrats";
import { useLocale, useTranslations } from "next-intl";
import { CategorySilhouette } from "../aircraft/category-silhouette.tsx";
import { countryName } from "../format/countries.ts";
import { Link } from "../i18n/navigation.ts";
import { publicProfileLinks } from "../profile/profile-links.ts";
import { pilotPhotoUrl } from "../site/api-relay.ts";
import { CountryFlag } from "../ui/country-flag.tsx";
import { PrivateIcon } from "../ui/icons.ts";
import { PilotAvatar } from "../ui/pilot-avatar.tsx";
import { utcTime } from "./board-rows.ts";
import { FlapText } from "./flap-text.tsx";

/** Colour of each status, from the board's colours (global.css). */
const STATUS_TONE: Record<BoardingStatus, string> = {
  boarding: "text-board-call",
  pushback: "text-board-ground",
  taxi: "text-board-descent",
  departed: "text-board-climb",
  airborne: "text-board-cruise",
  approach: "text-board-approach",
  landed: "text-board-climb",
  lost: "text-board-off",
};

/** Hour in UTC, « EST » after an estimate. */
export function TimeCell({ at, estimated = false }: { at: string | null; estimated?: boolean }) {
  const t = useTranslations("Boarding");
  return (
    <span
      className={`font-mono text-[13px] font-bold sm:text-[15px] ${estimated ? "text-board-ink" : "text-board-title"}`}
    >
      {utcTime(at)}
      {estimated && at && (
        <abbr
          title={t("estimated")}
          className="ml-0.5 text-[9px] tracking-[.04em] text-board-muted no-underline"
        >
          {t("est")}
        </abbr>
      )}
    </span>
  );
}

/** A cell that filters the boards on a click (airport, aircraft type). */
const CHOICE = "flex min-w-0 items-center gap-1.5 rounded-tag text-left hover:opacity-75";

/** Airport code in flaps and its name in small; a click shows only this airport's boards. */
export function AirportCell({
  icao,
  name,
  onChoose,
}: {
  icao: string | null;
  name: string | null;
  onChoose: (icao: string) => void;
}) {
  const t = useTranslations("Boarding.filter");
  const content = (
    <>
      <FlapText text={icao ?? ""} width={4} />
      {name && (
        <span className="min-w-0 truncate text-[11px] text-board-muted max-2xl:hidden">{name}</span>
      )}
    </>
  );
  if (!icao) return <span className="flex">{content}</span>;
  return (
    <button
      type="button"
      onClick={() => onChoose(icao)}
      title={`${name ?? icao} · ${t("onlyThis", { value: icao })}`}
      className={CHOICE}
    >
      {content}
    </button>
  );
}

/** Silhouette of the category in its colour (as on the map), then the type; a click filters it. */
export function AircraftCell({
  flight,
  onChoose,
}: {
  flight: BoardingFlight;
  onChoose: (type: string) => void;
}) {
  const t = useTranslations("Boarding.filter");
  return (
    <button
      type="button"
      onClick={() => onChoose(flight.aircraftType)}
      title={`${flight.aircraftType} · ${t("onlyThis", { value: flight.aircraftType })}`}
      className={`${CHOICE} max-w-full`}
    >
      <CategorySilhouette category={flight.aircraftClass?.category ?? null} />
      <span className="min-w-0 truncate font-mono text-xs font-semibold">
        {flight.aircraftType}
      </span>
    </button>
  );
}

/** Public pilot with the flag of their country; « Pilote masqué » for a private profile. */
export function PilotCell({ flight }: { flight: BoardingFlight }) {
  const t = useTranslations("Boarding");
  const locale = useLocale();
  const { pilot } = flight;
  if (!pilot) {
    return (
      <span className="flex items-center gap-1.5 text-[11.5px] whitespace-nowrap text-board-muted italic">
        <PrivateIcon size={13} aria-hidden="true" />
        {t("hiddenPilot")}
      </span>
    );
  }
  return (
    <Link
      href={publicProfileLinks(pilot.handle).page}
      className="flex min-w-0 items-center gap-1.5 rounded-tag font-sans text-[12.5px] text-board-title hover:underline"
    >
      <PilotAvatar pilot={pilot} src={pilotPhotoUrl(pilot.handle)} className="size-5 text-[10px]" />
      <span className="truncate">{pilot.name}</span>
      {pilot.country && (
        <span className="flex-none">
          <CountryFlag code={pilot.country} name={countryName(pilot.country, locale)} />
        </span>
      )}
    </Link>
  );
}

/** Status, as on an airport board; « Posé −118 » with the touchdown once landed. */
export function StatusCell({ flight }: { flight: BoardingFlight }) {
  const t = useTranslations("Boarding.status");
  const blink = flight.status === "boarding" ? "motion-safe:animate-pulse" : "";
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-tag border border-board-edge bg-board-head px-1 text-[9.5px] sm:gap-1.5 sm:px-1.5 sm:text-[10.5px] font-bold tracking-[.08em] whitespace-nowrap uppercase ${STATUS_TONE[flight.status]}`}
    >
      <span aria-hidden="true" className={`size-1.5 rounded-full bg-current ${blink}`} />
      {t(flight.status)}
      {flight.status === "landed" && flight.touchdownVs !== null && (
        <span className="tracking-normal">{Math.round(flight.touchdownVs)}</span>
      )}
    </span>
  );
}
