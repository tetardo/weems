"use client";

import type { FlightBands as Bands } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useFormatter, useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import { Link } from "../../i18n/navigation.ts";
import { PrivateIcon } from "../../ui/icons.ts";
import { BandRowCells, MinuteDetails, PhaseRow, useTime, type Marks } from "./band-parts.tsx";
import { BAND_GROUPS } from "./band-rows.ts";

/** Times under the grid, about every sixth of the flight. */
function TimeAxis({ bands }: { bands: Bands }) {
  const time = useTime();
  const step = Math.max(1, Math.ceil(bands.minutes.length / 6));
  return (
    <>
      <span />
      <div className="relative mt-1 h-4 text-[11.5px] text-muted">
        {bands.minutes.map((m, i) =>
          i % step === 0 ? (
            <span
              key={m.at}
              className="absolute"
              style={{ left: `${(i / bands.minutes.length) * 100}%` }}
            >
              {time(m.at)}
            </span>
          ) : null,
        )}
      </div>
    </>
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
  return (
    <div onMouseLeave={() => setHovered(null)}>
      <div className="overflow-x-auto">
        <div className="grid min-w-[560px] grid-cols-[8.5em_minmax(0,1fr)] items-center gap-y-1">
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
                    hovered={hovered}
                    onHover={setHovered}
                  />
                ))}
              </Fragment>
            );
          })}
          <TimeAxis bands={bands} />
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
