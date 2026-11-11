"use client";

import type { TrackView } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { utcTime } from "../format/flight-format.ts";

type TrackPoint = TrackView["points"][number];

/** Time, altitude, speeds and phase of the point under the pointer. */
export function PointDetails({ point }: { point: TrackPoint | undefined }) {
  const t = useTranslations("Flight.point");
  const phases = useTranslations("Phases");
  const format = useFormatter();
  const number = (value: number) => format.number(Math.round(value));
  const rows: [string, string][] = point
    ? [
        [t("time"), `${utcTime(point.at)} UTC`],
        [t("altitude"), `${number(point.altMsl)} ft`],
        [t("speed"), `${number(point.gs)} kt`],
        [t("vs"), `${number(point.vs)} ft/min`],
        [t("phase"), point.phase ? phases(point.phase) : "—"],
      ]
    : [];
  return (
    <dl className="flex min-h-6 flex-wrap gap-x-5 gap-y-1 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-1.5">
          <dt className="text-muted">{label}</dt>
          <dd className="m-0 font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
