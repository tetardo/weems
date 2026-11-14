"use client";

import type { BandMarkReason, FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useTime } from "../../flights/band-parts.tsx";
import { ALARM_TEXTS, UNMEASURED_TEXTS, alarmsOf } from "./ecam-alarms.ts";

/**
 * The stretches to review as amber messages, like the alert area of an E/WD (maquette v3,
 * validated 14/11): a click holds that minute. Nothing without marks (plan without them).
 */
export function AlarmPanel({
  bands,
  heldMinute,
  onPick,
}: {
  bands: Bands;
  heldMinute: number | null;
  onPick: (minute: number) => void;
}) {
  const t = useTranslations("Logbook.ecamPage");
  const time = useTime();
  if (bands.marks === null) return null;
  const alarms = alarmsOf(bands);
  const unmeasured: BandMarkReason[] = bands.unmeasured ?? [];
  return (
    <div className="mt-2.5 grid gap-x-6 border-t border-ecam-edge pt-2 leading-[22px] sm:grid-cols-2">
      <h3 className="col-span-full m-0 mb-1 text-[11.5px] font-normal tracking-[.08em] text-ecam-cyan">
        <span className="border-b border-ecam-cyan">{t("alarms")}</span> · {t("alarmsHint")}
      </h3>
      <div>
        {alarms.length === 0 && <div className="text-ecam-green">{t("noAlarm")}</div>}
        {alarms.map((a) => (
          <button
            key={`${a.reason}@${a.minute}`}
            type="button"
            onClick={() => onPick(a.minute)}
            className={`block cursor-pointer text-left whitespace-nowrap text-ecam-amber ${heldMinute === a.minute ? "outline-1 outline-offset-1 outline-ecam-amber" : ""}`}
          >
            <span className="mr-2.5 text-ecam-white">
              {time(bands.minutes[a.minute]?.at ?? "")}
            </span>
            {ALARM_TEXTS[a.reason]}
          </button>
        ))}
      </div>
      <div className="text-ecam-dim">
        {unmeasured.length > 0 && (
          <div>N/M : {unmeasured.map((r) => UNMEASURED_TEXTS[r]).join(", ")}</div>
        )}
        <div>{t("provisional")}</div>
      </div>
    </div>
  );
}
