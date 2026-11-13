import type { GoalView } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { formatRoute } from "../../format/flight-format.ts";
import { Link } from "../../i18n/navigation.ts";
import { fullFlightHref } from "../flight/full-flight-href.ts";
import { useGoalText } from "./goal-text.ts";

/** « Vols qui comptent »: date, route and what each flight added. */
export function GoalFlights({ goal }: { goal: GoalView }) {
  const t = useTranslations("Logbook.goals.detail");
  const text = useGoalText();
  const { kind } = goal.definition;
  if (goal.recentFlights.length === 0)
    return <p className="m-0 text-[13px] text-muted">{t("noFlight")}</p>;
  const added = (amount: number) =>
    kind === "goodPractices" || kind === "cleanStreak" ? "✓" : `+${text.value(kind, amount)}`;
  return (
    <table className="w-full text-[13px]">
      <thead className="text-muted">
        <tr>
          <th className="py-1 text-left font-normal">{t("date")}</th>
          <th className="py-1 text-left font-normal">{t("flight")}</th>
          <th className="py-1 text-right font-normal">{t(`added.${kind}`)}</th>
        </tr>
      </thead>
      <tbody>
        {goal.recentFlights.map((flight) => (
          <tr key={flight.flightId} className="border-t border-line">
            <td className="py-1.5 tabular-nums">{text.day(flight.at)}</td>
            <td className="py-1.5">
              <Link href={fullFlightHref(flight.flightId)} className="hover:underline">
                {formatRoute(flight.departureIcao, flight.arrivalIcao)}
              </Link>
            </td>
            <td className="py-1.5 text-right tabular-nums">{added(flight.added)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
