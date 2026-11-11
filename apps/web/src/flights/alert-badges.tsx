import type { FlightAlert } from "@weems/contrats";
import { useTranslations } from "next-intl";

/** Events that make a flight questionable: pause, time acceleration, slew, teleport, crash. */
export function AlertBadges({ alerts }: { alerts: readonly FlightAlert[] }) {
  const t = useTranslations("Alerts");
  return (
    <span className="flex flex-wrap gap-1">
      {alerts.map((alert) => (
        <span
          key={alert}
          className="rounded-full border border-accent-2/40 px-2 py-0.5 text-[.85em] text-accent-2"
        >
          {t(alert)}
        </span>
      ))}
    </span>
  );
}
