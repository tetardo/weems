import type { HiddenFlights } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatRoute } from "../format/flight-format.ts";
import { Link } from "../i18n/navigation.ts";
import { Button } from "../ui/button.tsx";
import { CardBox } from "../ui/card-box.tsx";
import { setFlightHiddenAction } from "./profile-actions.ts";

/** Flights kept off the public profile, each with « Show again ». */
export function HiddenFlightsPanel({ hidden }: { hidden: HiddenFlights }) {
  const t = useTranslations("Settings.hidden");
  const format = useFormatter();
  return (
    <CardBox>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[1.15em]">{t("title")}</h2>
        <span className="text-sm text-muted">{t("count", { count: hidden.flights.length })}</span>
      </div>
      <p className="mt-2 mb-0 text-sm text-muted">{t("help")}</p>
      <ul className="m-0 mt-2.5 list-none p-0">
        {hidden.flights.map((flight) => (
          <li
            key={flight.flightId}
            className="flex items-center justify-between gap-2 border-t border-line py-1.5 text-sm"
          >
            <Link href={`/flights/${flight.flightId}`} className="hover:underline">
              <b>{formatRoute(flight.departureIcao, flight.plannedArrivalIcao)}</b>{" "}
              {format.dateTime(new Date(flight.openedAt), { dateStyle: "short" })}
            </Link>
            <form action={setFlightHiddenAction.bind(null, flight.flightId, false)}>
              <Button type="submit" variant="ghost">
                {t("show")}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </CardBox>
  );
}
