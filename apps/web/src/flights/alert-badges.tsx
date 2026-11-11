import type { FlightAlert } from "@weems/contrats";
import { useTranslations } from "next-intl";

/** Events that make a flight questionable: pause, time acceleration, slew, teleport, crash. */
export function AlertBadges({ alerts }: { alerts: readonly FlightAlert[] }) {
  const t = useTranslations("Alerts");
  return (
    <span className="flex flex-wrap gap-1">
      {alerts.map((alert) => (
        <span key={alert} className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-900">
          {t(alert)}
        </span>
      ))}
    </span>
  );
}
