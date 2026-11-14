"use client";

import type { BandRow, FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { RowCells, type Pointer } from "../ecam-rows.tsx";
import { ecamValue } from "../ecam-values.ts";
import { isFlat, rangeText, rowRange, type RowRange } from "./row-facts.ts";

/** The values of one row as a line, on the whole flight's range, with the value read. */
function RowCurve({
  bands,
  row,
  range,
  cell,
}: {
  bands: Bands;
  row: BandRow;
  range: RowRange | null;
  cell: number | null;
}) {
  const count = bands.minutes.length;
  const values = bands.minutes.map((m) => m.values[row] ?? null);
  const low = range?.low ?? 0;
  const span = (range?.high ?? 1) - low || 1;
  const x = (i: number) => ((i + 0.5) / count) * 1000;
  const y = (v: number) => 74 - ((v - low) / span) * 68;
  const line = values
    .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
    .filter(Boolean)
    .map((p, i) => `${i ? "L" : "M"}${p}`)
    .join("");
  const read = cell === null ? null : (values[cell] ?? null);
  const shown = read === null ? null : ecamValue(row, read);
  return (
    <>
      <span className="self-start pt-1 text-[12.5px] text-ecam-green">
        {shown ? `${shown.text} ${shown.unit}` : "---"}
      </span>
      <svg
        viewBox="0 0 1000 80"
        preserveAspectRatio="none"
        className="mb-1 block h-20 w-full border border-ecam-edge"
      >
        {low < 0 && low + span > 0 && (
          <line x1={0} x2={1000} y1={y(0)} y2={y(0)} className="stroke-ecam-edge" strokeDasharray="4 4" />
        )}
        <path d={line} className="fill-none stroke-ecam-green" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {cell !== null && read !== null && (
          <circle cx={x(cell)} cy={y(read)} r={3.5} className="fill-ecam-yellow" />
        )}
      </svg>
      <span />
    </>
  );
}

/**
 * One row of the ECAM page: its name opens the precise curve under it, its range on the right
 * (whole flight), dimmed when it never changes (Greg, 14/11/2026, ideas 1, 3 and 8).
 */
export function PageRow({
  bands,
  full,
  row,
  cell,
  open,
  onToggle,
}: {
  bands: Bands;
  full: Bands;
  row: BandRow;
  cell: number | null;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("Logbook.ecamPage");
  const rows = useTranslations("Logbook.bands.rows");
  const short = useTranslations("Logbook.bands.shortRows");
  const range = rowRange(full.minutes, row);
  const dim = isFlat(range) ? "opacity-35" : "";
  const pointer: Pointer = { hovered: cell, pinned: null, readLine: true };
  return (
    <>
      <button
        type="button"
        title={`${rows(row)} · ${t(open ? "closeCurve" : "openCurve")}`}
        aria-expanded={open}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={onToggle}
        className={`cursor-pointer truncate pr-2 text-left text-[12.5px] ${dim} ${open ? "text-ecam-yellow" : "hover:text-ecam-cyan"}`}
      >
        {open ? "▾ " : ""}
        {short(row)}
      </button>
      <RowCells bands={bands} row={row} pointer={pointer} scale={full.minutes} className={dim} />
      <span className={`truncate pl-3 text-right text-[11px] text-ecam-dim ${dim}`}>
        {rangeText(row, range)}
      </span>
      {open && <RowCurve bands={bands} row={row} range={range} cell={cell} />}
    </>
  );
}
