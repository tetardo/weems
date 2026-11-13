import { useFormatter, useTranslations } from "next-intl";
import { CategoryBadge } from "../../aircraft/category-badge.tsx";
import { formatRoute } from "../../format/flight-format.ts";
import { FlightMinis } from "../flight-minis.tsx";
import { VerdictChip } from "../flights/verdict-chip.tsx";
import { TouchdownValue } from "../touchdown-value.tsx";
import type { FullFlight } from "./load-full-flight.ts";

/** Callsign, registration, route, aircraft and times; on the right the verdict and the touchdown. */
export function FullFlightHeader({ data }: { data: FullFlight }) {
  const t = useTranslations("Logbook.flight");
  const format = useFormatter();
  const { entry, flight, bands } = data;
  const time = (iso: string) =>
    format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  const ident = [flight.callsign, flight.aircraft.registration].filter(Boolean).join(" · ");
  return (
    <section className="rounded-panel border border-line bg-surface px-5 py-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold tracking-wide text-muted">{ident}</div>
          <h1 className="m-0 font-title text-[30px] leading-tight">
            {formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted">
            <b className="text-ink">{flight.aircraft.model ?? flight.aircraft.title}</b>
            <CategoryBadge aircraftClass={flight.aircraftClass} />
            <span>
              {format.dateTime(new Date(flight.openedAt), { dateStyle: "full", timeZone: "UTC" })} ·{" "}
              {time(flight.openedAt)} → {time(flight.closedAt ?? flight.openedAt)} UTC
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-right max-sm:items-start max-sm:text-left">
          <VerdictChip verdict={entry.verdict} />
          {entry.touchdownVs !== null && (
            <>
              <TouchdownValue vs={entry.touchdownVs} className="text-[32px] leading-none" />
              <span className="text-[12px] text-muted">{t("touchdownUnit")}</span>
            </>
          )}
        </div>
      </div>
      <FlightMinis
        facts={{
          ...entry,
          distanceNm: bands?.distanceNm ?? null,
          fuelUsedKg: bands?.fuelUsedKg ?? null,
        }}
      />
    </section>
  );
}
