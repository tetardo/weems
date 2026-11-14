"use client";

import type { BandRow, FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { RowCells, type Pointer } from "../ecam-rows.tsx";
import { ecamValue } from "../ecam-values.ts";
import { linePath } from "./line-path.ts";
import { isFlat, rangeText, rowRange, type RowRange } from "./row-facts.ts";

/** Where the curve of a row draws: cells across, the whole flight's range up (80 high). */
function curveScale(count: number, range: RowRange | null) {
  const low = range?.low ?? 0;
  const span = (range?.high ?? 1) - low || 1;
  return {
    x: (i: number) => ((i + 0.5) / count) * 1000,
    y: (v: number) => 74 - ((v - low) / span) * 68,
    crossesZero: low < 0 && low + span > 0,
  };
}

/** The value read, as a display writes it, beside the curve. */
function CurveValue({ row, value }: { row: BandRow; value: number | null }) {
  const shown = value === null ? null : ecamValue(row, value);
  return (
    <span className="self-start pt-1 text-[12.5px] text-ecam-green">
      {shown ? `${shown.text} ${shown.unit}` : "---"}
    </span>
  );
}

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
  const values = bands.minutes.map((m) => m.values[row] ?? null);
  const { x, y, crossesZero } = curveScale(values.length, range);
  const read = cell === null ? null : (values[cell] ?? null);
  return (
    <>
      <CurveValue row={row} value={read} />
      <svg
        viewBox="0 0 1000 80"
        preserveAspectRatio="none"
        className="mb-1 block h-20 w-full border border-ecam-edge"
      >
        {crossesZero && (
          <line
            x1={0}
            x2={1000}
            y1={y(0)}
            y2={y(0)}
            className="stroke-ecam-edge"
            strokeDasharray="4 4"
          />
        )}
        <path
          d={linePath(values, x, y)}
          className="fill-none stroke-ecam-green"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
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
        className={`cursor-pointer truncate pr-2 text-left text-[12.5px] outline-none focus-visible:outline-1 focus-visible:outline-ecam-cyan ${dim} ${open ? "text-ecam-yellow" : "hover:text-ecam-cyan"}`}
      >
        {open ? "▾ " : ""}
        {short(row)}
      </button>
      <RowCells bands={bands} row={row} pointer={pointer} scale={full.minutes} className={dim} />
      <span
        title={rangeText(row, range)}
        className={`truncate pl-3 text-right text-[11px] text-ecam-dim ${dim}`}
      >
        {rangeText(row, range)}
      </span>
      {open && <RowCurve bands={bands} row={row} range={range} cell={cell} />}
    </>
  );
}
