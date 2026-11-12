import type { LiveFlight, LiveRoute } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration } from "../format/flight-format.ts";
import { routeProgress } from "./route-progress.ts";

/** Why there is no progress to show, or null when there is one (or while the route loads). */
function missingReason(flight: LiveFlight, route: LiveRoute): string | null {
  if (!flight.departureIcao || !flight.plannedArrivalIcao) return "noFlightPlan";
  if (!route.departure || !route.arrival) return "unknownAirport";
  return null;
}

/** Progress of the selected flight along its route: bar, share flown, distance and time left. */
export function RouteSummary({ flight, route }: { flight: LiveFlight; route: LiveRoute | null }) {
  const t = useTranslations("Live.route");
  const format = useFormatter();
  if (!route) return null;
  const reason = missingReason(flight, route);
  const progress = routeProgress(flight.position, route.departure, route.arrival);
  if (reason || !progress) {
    return <p className="mt-3 text-sm text-muted">{t(reason ?? "unknownAirport")}</p>;
  }
  const percent = Math.round(progress.fraction * 100);
  const timeLeft =
    progress.remainingMinutes === null ? null : formatDuration(progress.remainingMinutes * 60);
  return (
    <div className="mt-3">
      <div
        role="progressbar"
        aria-label={t("progress")}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-1.5 flex justify-between text-sm">
        <strong>{t("percent", { percent })}</strong>
        <span className="text-muted">
          {t("remaining", {
            distance: format.number(progress.remainingNm, { maximumFractionDigits: 0 }),
          })}
          {timeLeft && ` · ${t("timeLeft", { time: timeLeft })}`}
        </span>
      </p>
    </div>
  );
}
