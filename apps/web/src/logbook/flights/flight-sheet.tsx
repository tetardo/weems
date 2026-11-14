import type { FlightBands as Bands, LogbookEntry, TrackView } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useFormatter, useTranslations } from "next-intl";
import { CategoryBadge } from "../../aircraft/category-badge.tsx";
import { formatRoute } from "../../format/flight-format.ts";
import { Link } from "../../i18n/navigation.ts";
import { BackIcon, StatsIcon } from "../../ui/icons.ts";
import { ecamFlightHref, fullFlightHref } from "../flight/full-flight-href.ts";
import { FlightMinis } from "../flight-minis.tsx";
import { LogbookCard } from "../logbook-card.tsx";
import { StageProfile } from "../summary/stage-profile.tsx";
import { EcamBands } from "../ecam/ecam-bands.tsx";
import { FlightBands } from "./flight-bands.tsx";
import { VerdictChip } from "./verdict-chip.tsx";

/** Route, aircraft, times and verdict, with the way to the full flight page. */
function SheetHeader({ entry }: { entry: LogbookEntry }) {
  const t = useTranslations("Logbook.flights");
  const format = useFormatter();
  const { flight } = entry;
  const time = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <Link
          href="/logbook/flights"
          className="mb-1 inline-flex items-center gap-1 text-[13px] text-link md:hidden"
        >
          <BackIcon size={16} aria-hidden="true" />
          {t("all")}
        </Link>
        <h1 className="m-0 font-title text-[24px]">
          {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
          <b className="text-ink">{flight.aircraftModel ?? flight.aircraftTitle}</b>
          <CategoryBadge aircraftClass={flight.aircraftClass} />
          <span>
            {format.dateTime(new Date(flight.openedAt), {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            · {time(flight.openedAt)} → {time(flight.closedAt ?? flight.openedAt)} UTC
          </span>
          <VerdictChip verdict={entry.verdict} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href={fullFlightHref(flight.flightId)} className={buttonClass("outline")}>
          {t("fullPage")}
        </Link>
        <Link href={ecamFlightHref(flight.flightId)} className={buttonClass("outline")}>
          {t("ecamPage")}
        </Link>
      </div>
    </div>
  );
}

/**
 * Sheet of the selected flight (maquette v8, B): header and small cards, flight bands, altitude
 * profile by stage. Map, phases, landing, log and review stay on the full flight page.
 */
export function FlightSheet({
  entry,
  bands,
  track,
}: {
  entry: LogbookEntry;
  bands: Bands | null;
  track: TrackView | null;
}) {
  const t = useTranslations("Logbook.flights");
  const facts = {
    ...entry,
    distanceNm: bands?.distanceNm ?? null,
    fuelUsedKg: bands?.fuelUsedKg ?? null,
  };
  return (
    <div className="grid gap-4">
      <section className="rounded-panel border border-line bg-surface px-5 py-4">
        <SheetHeader entry={entry} />
        <FlightMinis facts={facts} />
      </section>
      <LogbookCard
        icon={StatsIcon}
        title={t("bands")}
        aside={bands && t("bandsAside", { minutes: bands.minutes.length, rows: bands.rows.length })}
      >
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
      {track && track.points.length > 1 && (
        <LogbookCard icon={StatsIcon} title={t("profile")}>
          <StageProfile points={track.points} />
        </LogbookCard>
      )}
    </div>
  );
}
