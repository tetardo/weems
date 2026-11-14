"use client";

import type { FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { MILESTONE_CODES, milestones } from "./row-facts.ts";
import { cellOfMinute, type BandWindow, type WindowedBands } from "./window-bands.ts";

/** Takeoff, top of climb, top of descent and touchdown, under the phase row (Greg, idea 2). */
export function MilestoneRow({
  full,
  view,
  window,
}: {
  full: Bands;
  view: WindowedBands;
  window: BandWindow;
}) {
  const t = useTranslations("Logbook.ecamPage.milestones");
  const count = view.bands.minutes.length;
  const shown = milestones(full.minutes).flatMap(({ key, minute }) => {
    const cell = cellOfMinute(view, window, minute);
    return cell === null ? [] : [{ key, left: ((cell + 0.5) / count) * 100 }];
  });
  return (
    <>
      <span />
      <div className="relative h-4">
        {shown.map(({ key, left }) => (
          <span
            key={key}
            title={t(key)}
            style={{ left: `${left}%` }}
            className="absolute top-0 border-l border-ecam-white/60 pl-0.5 text-[10.5px] leading-4 text-ecam-white"
          >
            {MILESTONE_CODES[key]}
          </span>
        ))}
      </div>
      <span />
    </>
  );
}
