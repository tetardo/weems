import type { LiveFlight } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration } from "../format/flight-format.ts";
import type { Airports } from "./airport-book.ts";
import { routeProgress } from "./route-progress.ts";

/** Why there is no progress to show, or null when there is one (or while airports load). */
function missingReason(flight: LiveFlight, airports: Airports): string | null {
  const { departureIcao, plannedArrivalIcao } = flight;
  if (!departureIcao || !plannedArrivalIcao) return "noFlightPlan";
  if (airports.get(departureIcao) === null || airports.get(plannedArrivalIcao) === null) {
    return "unknownAirport";
  }
  return null;
}

/**
 * Progress of a flight along its route: departure, bar and arrival, share flown, distance and
 * time left. Nothing while the airports load.
 */
export function RouteSummary({ flight, airports }: { flight: LiveFlight; airports: Airports }) {
  const t = useTranslations("Live.route");
  const format = useFormatter();
  const reason = missingReason(flight, airports);
  if (reason) return <p className="mt-2.5 text-sm text-muted">{t(reason)}</p>;
  const departure = airports.get(flight.departureIcao ?? "");
  const arrival = airports.get(flight.plannedArrivalIcao ?? "");
  const progress = routeProgress(flight.position, departure ?? null, arrival ?? null);
  if (!progress) return null;
  const percent = Math.round(progress.fraction * 100);
  const timeLeft =
    progress.remainingMinutes === null ? null : formatDuration(progress.remainingMinutes * 60);
  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 font-title text-[13px] font-bold">
        <span>{flight.departureIcao}</span>
        <div
          role="progressbar"
          aria-label={t("progress")}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-1.5 rounded-full bg-line"
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
          <span
            className="absolute top-1/2 -ml-1.75 -mt-1.75 size-3.5 rounded-full border-3 border-accent bg-surface"
            style={{ left: `${percent}%` }}
          />
        </div>
        <span>{flight.plannedArrivalIcao}</span>
      </div>
      <p className="mt-1 flex justify-between gap-3 text-[12.5px] text-muted">
        <span>
          {t.rich("flown", {
            percent,
            strong: (text) => <strong className="text-ink">{text}</strong>,
          })}
        </span>
        <span>
          {t("remaining", {
            distance: format.number(progress.remainingNm, { maximumFractionDigits: 0 }),
          })}
          {timeLeft && ` · ${t("timeLeft", { time: timeLeft })}`}
        </span>
      </p>
    </div>
  );
}
