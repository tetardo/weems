import type { LiveFlight } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";

/** Details of the selected flight (spec J1, part 4). */
export function FlightPanel({ flight, onClose }: { flight: LiveFlight; onClose: () => void }) {
  const t = useTranslations("Live");
  const phases = useTranslations("Phases");
  const format = useFormatter();
  const number = (value: number) => format.number(value, { maximumFractionDigits: 0 });
  const { position } = flight;
  const rows: [string, string][] = [
    [t("fields.aircraft"), flight.aircraftTitle],
    [t("fields.departure"), flight.departureIcao ?? "—"],
    [t("fields.arrival"), flight.plannedArrivalIcao ?? "—"],
    [t("fields.phase"), phases(position.phase)],
    [t("fields.altitude"), `${number(position.altMsl)} ft`],
    [t("fields.groundSpeed"), `${number(position.gs)} kt`],
  ];
  return (
    <aside className="absolute top-3 right-3 w-60 rounded-2xl border border-line bg-surface p-3 shadow-[0_8px_24px_rgb(0_0_0/.18)]">
      <div className="flex items-baseline justify-between">
        <strong className="text-lg">{flight.callsign}</strong>
        <button type="button" onClick={onClose} aria-label={t("close")}>
          ×
        </button>
      </div>
      {flight.signal === "lost" && <p className="my-1 text-accent-2">{t("signalLost")}</p>}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-muted">{label}</dt>
            <dd className="m-0">{value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
