import { FOUNDER_OFFER, type FounderFlight, type MyFounder } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { DoneIcon, ExcludedIcon } from "../ui/icons.ts";
import { meterSegments } from "./founder-display.ts";

/** Three segments, one per valid flight, then « 2 of 3 flights · 1 of 2 days ». */
function Meter({ mine }: { mine: MyFounder }) {
  const t = useTranslations("Founders.progress");
  return (
    <div>
      <div className="flex gap-1.5" aria-hidden="true">
        {meterSegments(mine.validFlights).map((done, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${done ? "bg-founder" : "bg-ink/12"}`}
          />
        ))}
      </div>
      <p className="m-0 mt-2 text-sm text-muted">
        {t("count", {
          flights: Math.min(mine.validFlights, FOUNDER_OFFER.requiredFlights),
          requiredFlights: FOUNDER_OFFER.requiredFlights,
          days: Math.min(mine.validDays, FOUNDER_OFFER.requiredDays),
          requiredDays: FOUNDER_OFFER.requiredDays,
        })}
      </p>
    </div>
  );
}

/** One recent flight and why it counts or not. */
function FlightLine({ flight }: { flight: FounderFlight }) {
  const t = useTranslations("Founders.checks");
  const format = useFormatter();
  const valid = flight.check === "valid";
  const Icon = valid ? DoneIcon : ExcludedIcon;
  const route = `${flight.departureIcao ?? "····"} → ${flight.arrivalIcao ?? "····"}`;
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icon
        size={16}
        aria-hidden="true"
        className={`mt-0.5 flex-none ${valid ? "text-success" : "text-muted"}`}
      />
      <span className="min-w-0">
        <span className="font-semibold">{route}</span>
        <span className="text-muted">
          {" · "}
          {format.dateTime(new Date(flight.openedAt), { day: "numeric", month: "short" })}
          {" · "}
          {t(flight.check)}
        </span>
      </span>
    </li>
  );
}

/** Where the logged-in pilot stands: place won (waiting or confirmed), or flights still to do. */
export function FounderProgress({ mine }: { mine: MyFounder }) {
  const t = useTranslations("Founders.progress");
  const format = useFormatter();
  const { place } = mine;
  if (place?.status === "confirmed") {
    return (
      <p className="m-0 font-semibold text-founder">{t("confirmed", { number: place.number })}</p>
    );
  }
  if (place?.status === "pending") {
    const at = format.dateTime(new Date(place.confirmsAt), {
      dateStyle: "medium",
      timeStyle: "short",
    });
    return (
      <p className="m-0 text-sm">
        <span className="font-semibold text-founder">{t("pending", { number: place.number })}</span>{" "}
        <span className="text-muted">{t("pendingHelp", { at })}</span>
      </p>
    );
  }
  if (place?.status === "refused") return <p className="m-0 text-sm text-muted">{t("refused")}</p>;
  if (!mine.eligible) return <p className="m-0 text-sm text-muted">{t("ineligible")}</p>;
  return (
    <div className="grid gap-3">
      <Meter mine={mine} />
      {mine.flights.length > 0 && (
        <ul className="m-0 grid list-none gap-1.5 p-0">
          {mine.flights.map((flight) => (
            <FlightLine key={flight.flightId} flight={flight} />
          ))}
        </ul>
      )}
    </div>
  );
}
