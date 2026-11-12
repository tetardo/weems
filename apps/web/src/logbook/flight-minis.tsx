import type { FlightSummary } from "@weems/contrats";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { formatDuration } from "../format/flight-format.ts";
import { TouchdownValue } from "./touchdown-value.tsx";

function Mini({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-box border border-line px-3 py-2">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="text-[17px] font-semibold tabular-nums">{children}</div>
    </div>
  );
}

/** What the six small cards show: the last flight of the Résumé or the flight of the sheet. */
export interface FlightFacts {
  flight: FlightSummary;
  touchdownVs: number | null;
  bounces: number;
  distanceNm: number | null;
  fuelUsedKg: number | null;
}

/** The six small cards of a flight: touchdown, duration, distance, fuel, bounces, alerts. */
export function FlightMinis({ facts: last }: { facts: FlightFacts }) {
  const t = useTranslations("Logbook.minis");
  const site = useTranslations("Site");
  const alerts = useTranslations("Alerts");
  const { flight } = last;
  const none = site("notMeasured");
  const duration = formatDuration(flight.times.airborneS ?? flight.times.blockS);
  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-2 @md:grid-cols-3 @2xl:grid-cols-6">
        <Mini label={t("touchdown")}>
          {last.touchdownVs === null ? none : <TouchdownValue vs={last.touchdownVs} />}
        </Mini>
        <Mini label={t("duration")}>{duration ?? none}</Mini>
        <Mini label={t("distance")}>
          {last.distanceNm === null ? none : t("nm", { nm: Math.round(last.distanceNm) })}
        </Mini>
        <Mini label={t("fuel")}>
          {last.fuelUsedKg === null ? (
            <span className="text-[14px] font-normal text-muted">{none}</span>
          ) : (
            t("tonnes", { tonnes: last.fuelUsedKg / 1000 })
          )}
        </Mini>
        <Mini label={t("bounces")}>{last.bounces}</Mini>
        <Mini label={t("alerts")}>
          {flight.alerts.length === 0
            ? t("noAlert")
            : flight.alerts.map((a) => alerts(a)).join(", ")}
        </Mini>
      </div>
    </div>
  );
}
