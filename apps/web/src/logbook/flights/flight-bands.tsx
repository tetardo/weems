"use client";

import type { FlightBands as Bands } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useFormatter, useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import { Link } from "../../i18n/navigation.ts";
import { PrivateIcon } from "../../ui/icons.ts";
import { useStoredSwitch } from "../../ui/use-stored-switch.ts";
import {
  BandRowCells,
  MinuteDetails,
  PhaseRow,
  TimeAxis,
  useTime,
  type Marks,
} from "./band-parts.tsx";
import { BAND_GROUPS } from "./band-rows.ts";

/** The discreet switch between full row names and cockpit abbreviations (Greg, 14/11/2026). */
function ShortNamesToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  const t = useTranslations("Logbook.bands");
  return (
    <label
      title={t("abbreviationsHint")}
      className="mt-1 flex cursor-pointer items-center gap-1 self-start text-[11px] text-muted hover:text-ink"
    >
      <input
        type="checkbox"
        checked={on}
        onChange={(event) => onChange(event.target.checked)}
        className="size-3 accent-accent"
      />
      {t("abbreviations")}
    </label>
  );
}

/** The marks this aircraft could not give (missing or frozen value): never held against the pilot. */
function Unmeasured({ reasons }: { reasons: Bands["unmeasured"] }) {
  const t = useTranslations("Logbook.bands");
  const format = useFormatter();
  if (!reasons || reasons.length === 0) return null;
  const list = format.list(reasons.map((reason) => t(`reasons.${reason}`)));
  return <p className="m-0 mt-2 text-[12.5px] text-muted">{t("unmeasured", { reasons: list })}</p>;
}

/** The way to the stretches to review, for a free pilot. */
function MarksLocked() {
  const t = useTranslations("Logbook.bands");
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-box bg-accent-2/10 px-3 py-2.5 text-[12.5px]">
      <PrivateIcon size={16} className="flex-none text-accent-2" aria-hidden="true" />
      <p className="m-0 min-w-0 flex-1">
        <b>{t("marksTitle")}</b> : {t("marksLocked")}
      </p>
      <Link href="/plans" className={`${buttonClass()} min-h-9 text-[13px]`}>
        {t("discover")}
      </Link>
    </div>
  );
}

/** The stretches to review (Pilot Pro), or the way to them for a free pilot. */
function MarksLine({
  marks,
  unmeasured,
  minutes,
  onSelect,
}: {
  marks: Marks | null;
  unmeasured: Bands["unmeasured"];
  minutes: Bands["minutes"];
  onSelect: (i: number) => void;
}) {
  const t = useTranslations("Logbook.bands");
  const time = useTime();
  if (marks === null) return <MarksLocked />;
  if (marks.length === 0)
    return (
      <>
        <p className="m-0 mt-2 text-[12.5px] text-muted">{t("noMarks")}</p>
        <Unmeasured reasons={unmeasured} />
      </>
    );
  return (
    <>
      <ul className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0 text-[12.5px]">
        {marks.map((mark) => (
          <li key={`${mark.reason}-${mark.from}`}>
            <button
              type="button"
              onClick={() => onSelect(mark.from)}
              className="rounded-tag border border-danger/60 px-2 py-0.5 hover:bg-danger/10"
            >
              {time(minutes[mark.from]?.at ?? "")} · {t(`reasons.${mark.reason}`)}
            </button>
          </li>
        ))}
        <li className="text-muted">{t("provisional")}</li>
      </ul>
      <Unmeasured reasons={unmeasured} />
    </>
  );
}

/**
 * « Bandes de vol » (maquette v8): one column per minute, one row per parameter, shaded from low
 * to high; hovering a column shows every value of that minute. `withMarks` false leaves out the
 * stretches to review (a flight in progress has none yet).
 */
export function FlightBands({ bands, withMarks = true }: { bands: Bands; withMarks?: boolean }) {
  const t = useTranslations("Logbook.bands");
  const [hovered, setHovered] = useState<number | null>(null);
  const [short, setShort] = useStoredSwitch("weems-bands-short-names", false);
  return (
    <div onMouseLeave={() => setHovered(null)}>
      <div className="overflow-x-auto overflow-y-hidden">
        <div
          className={`grid min-w-[560px] items-center gap-y-1 ${short ? "grid-cols-[6.5em_minmax(0,1fr)]" : "grid-cols-[8.5em_minmax(0,1fr)]"}`}
        >
          <PhaseRow bands={bands} onHover={setHovered} />
          {BAND_GROUPS.map(({ key, rows }) => {
            const shown = rows.filter((row) => bands.rows.includes(row));
            if (shown.length === 0) return null;
            return (
              <Fragment key={key}>
                <span className="col-span-full mt-2 text-[11px] font-semibold tracking-wide text-muted uppercase">
                  {t(`groups.${key}`)}
                </span>
                {shown.map((row) => (
                  <BandRowCells
                    key={row}
                    bands={bands}
                    row={row}
                    short={short}
                    hovered={hovered}
                    onHover={setHovered}
                  />
                ))}
              </Fragment>
            );
          })}
          <TimeAxis bands={bands} corner={<ShortNamesToggle on={short} onChange={setShort} />} />
        </div>
      </div>
      {withMarks && (
        <MarksLine
          marks={bands.marks}
          unmeasured={bands.unmeasured}
          minutes={bands.minutes}
          onSelect={setHovered}
        />
      )}
      <MinuteDetails bands={bands} index={hovered} />
    </div>
  );
}
