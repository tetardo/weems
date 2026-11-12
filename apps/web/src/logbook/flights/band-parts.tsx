"use client";

/** Pieces of the flight bands: rows of cells, phase row, values of the hovered minute. */
import type { BandRow, FlightBands as Bands } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { colorOf } from "../../flight/phase-colors.ts";
import { bandCells, type Cell } from "./band-scale.ts";
import { bandValue } from "./band-rows.ts";

const SHADES: Record<Cell["tone"], readonly string[]> = {
  value: ["bg-line/60", "bg-accent/25", "bg-accent/45", "bg-accent/70", "bg-accent"],
  climb: ["bg-line/60", "bg-success/30", "bg-success/50", "bg-success/75", "bg-success"],
  descent: ["bg-line/60", "bg-accent-2/30", "bg-accent-2/50", "bg-accent-2/75", "bg-accent-2"],
};
export type Marks = NonNullable<Bands["marks"]>;

const marked = (marks: Marks, row: BandRow, i: number) =>
  marks.some((m) => m.row === row && i >= m.from && i <= m.to);

export function useTime() {
  const format = useFormatter();
  return (iso: string) => format.dateTime(new Date(iso), { hour: "2-digit", minute: "2-digit" });
}

/** One row: its name, then one cell per minute; the hovered minute is outlined. */
export function BandRowCells({
  bands,
  row,
  hovered,
  onHover,
}: {
  bands: Bands;
  row: BandRow;
  hovered: number | null;
  onHover: (i: number) => void;
}) {
  const t = useTranslations("Logbook.bands.rows");
  return (
    <>
      <span className="truncate pr-2 text-[12.5px]">{t(row)}</span>
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${bands.minutes.length}, minmax(0, 1fr))` }}
      >
        {bandCells(bands.minutes, row).map((cell, i) => (
          <span
            key={i}
            onMouseEnter={() => onHover(i)}
            className={`h-3 rounded-[1px] ${cell ? (SHADES[cell.tone][cell.level] ?? "") : "bg-transparent"} ${bands.marks && marked(bands.marks, row, i) ? "outline-1 outline-danger" : ""} ${hovered === i ? "outline-2 outline-ink" : ""}`}
          />
        ))}
      </div>
    </>
  );
}

/** The phase above the rows, in the colours of the flight page. */
export function PhaseRow({ bands, onHover }: { bands: Bands; onHover: (i: number) => void }) {
  const t = useTranslations("Logbook.bands");
  return (
    <>
      <span className="text-[12.5px] font-semibold">{t("phase")}</span>
      <div
        className="grid gap-px"
        style={{ gridTemplateColumns: `repeat(${bands.minutes.length}, minmax(0, 1fr))` }}
      >
        {bands.minutes.map((m, i) => (
          <span
            key={m.at}
            onMouseEnter={() => onHover(i)}
            className="h-2.5"
            style={{ background: colorOf(m.phase) }}
          />
        ))}
      </div>
    </>
  );
}

/** Every value of the hovered minute (spec carnet privé, § 4). */
export function MinuteDetails({ bands, index }: { bands: Bands; index: number | null }) {
  const t = useTranslations("Logbook.bands");
  const rows = useTranslations("Logbook.bands.rows");
  const phases = useTranslations("Phases");
  const time = useTime();
  const minute = index === null ? undefined : bands.minutes[index];
  if (!minute) return <p className="m-0 mt-3 text-[12.5px] text-muted">{t("hover")}</p>;
  return (
    <dl className="m-0 mt-3 grid grid-cols-2 gap-x-4 gap-y-0.5 rounded-box border border-line px-3 py-2 text-[12.5px] sm:grid-cols-3 lg:grid-cols-5">
      <div className="col-span-full font-semibold">
        {time(minute.at)} UTC{minute.phase && ` · ${phases(minute.phase)}`}
      </div>
      {bands.rows.map((row) => {
        const v = minute.values[row];
        const shown = v === null || v === undefined ? null : bandValue(row, v);
        return (
          <div key={row} className="flex justify-between gap-2">
            <dt className="text-muted">{rows(row)}</dt>
            <dd className="m-0 tabular-nums">
              {shown ? t(`values.${shown.key}`, { value: shown.value }) : "—"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
