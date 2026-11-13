"use client";

import type { BoardingFlight, BoardingStatus } from "@weems/contrats";
import { useLocale, useTranslations } from "next-intl";
import { CategorySilhouette } from "../aircraft/category-silhouette.tsx";
import { countryName } from "../format/countries.ts";
import { Link } from "../i18n/navigation.ts";
import { publicProfileLinks } from "../profile/profile-links.ts";
import { pilotPhotoUrl } from "../site/api-relay.ts";
import { CountryFlag } from "../ui/country-flag.tsx";
import { FounderBadge } from "../ui/founder-badge.tsx";
import { HoverBubble } from "../ui/hover-bubble.tsx";
import { HiddenPilotIcon } from "../ui/icons.ts";
import { PilotAvatar } from "../ui/pilot-avatar.tsx";
import { RankBadge } from "../ui/rank-badge.tsx";
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

/**
 * A cell that filters the boards on a click (airport, aircraft type). A button sizes to its
 * content: `w-full` holds it to its column, so a long name is cut with « … » instead of running
 * under the next column.
 */
const CHOICE =
  "flex w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-tag text-left hover:opacity-75";

/**
 * Airport code in flaps; its name in a bubble on hover (Greg, 13/11: no name in the row). A click
 * shows only this airport's boards.
 */
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
  if (!icao) return <FlapText text="" width={4} />;
  return (
    <HoverBubble label={icao} text={name ?? icao}>
      <button
        type="button"
        onClick={() => onChoose(icao)}
        aria-label={`${name ?? icao} · ${t("onlyThis", { value: icao })}`}
        className={CHOICE}
      >
        <FlapText text={icao} width={4} />
      </button>
    </HoverBubble>
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
      className={CHOICE}
    >
      <CategorySilhouette category={flight.aircraftClass?.category ?? null} />
      <span className="min-w-0 truncate font-mono text-xs font-semibold">
        {flight.aircraftType}
      </span>
    </button>
  );
}

/**
 * Public pilot: photo or initial (name in a bubble on hover, link to their page), grade, founder
 * badge and flag. A private profile: a grey disc with a ghost, « Pilote masqué » in its bubble.
 */
export function PilotCell({ flight }: { flight: BoardingFlight }) {
  const t = useTranslations("Boarding");
  const locale = useLocale();
  const { pilot } = flight;
  if (!pilot) {
    return (
      <HoverBubble text={t("hiddenPilot")}>
        <span
          role="img"
          aria-label={t("hiddenPilot")}
          className="grid size-5 flex-none place-items-center rounded-full bg-board-off/40 text-board-muted"
        >
          <HiddenPilotIcon size={12} aria-hidden="true" />
        </span>
      </HoverBubble>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <HoverBubble text={pilot.name}>
        <Link
          href={publicProfileLinks(pilot.handle).page}
          aria-label={pilot.name}
          className="rounded-full hover:opacity-80"
        >
          <PilotAvatar
            pilot={pilot}
            src={pilotPhotoUrl(pilot.handle)}
            className="size-5 text-[10px]"
          />
        </Link>
      </HoverBubble>
      {pilot.rank !== undefined && <RankBadge rank={pilot.rank} compact />}
      {pilot.founderNumber !== undefined && <FounderBadge number={pilot.founderNumber} compact />}
      {pilot.country && (
        <span className="flex-none">
          <CountryFlag code={pilot.country} name={countryName(pilot.country, locale)} />
        </span>
      )}
    </span>
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
