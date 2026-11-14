"use client";

/** Rows of the cockpit screen of the flight bands, by group, in the cockpit colours. */
import type { BandRow, FlightBands as Bands } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Fragment, type ReactNode } from "react";
import { BAND_GROUPS } from "../flights/band-rows.ts";
import { bandCells, type Cell } from "../flights/band-scale.ts";

/** Cockpit colours: green values, cyan climbing, white descending. */
const SHADES: Record<Cell["tone"], readonly string[]> = {
  value: [
    "bg-ecam-off",
    "bg-ecam-green/25",
    "bg-ecam-green/45",
    "bg-ecam-green/70",
    "bg-ecam-green",
  ],
  climb: ["bg-ecam-off", "bg-ecam-cyan/30", "bg-ecam-cyan/50", "bg-ecam-cyan/75", "bg-ecam-cyan"],
  descent: [
    "bg-ecam-off",
    "bg-ecam-white/30",
    "bg-ecam-white/50",
    "bg-ecam-white/75",
    "bg-ecam-white",
  ],
};

/** The minute read; `readLine` true when a line marks it instead of the cells' outline. */
export interface Pointer {
  hovered: number | null;
  pinned: number | null;
  readLine?: boolean;
}

function cellClass(cell: Cell | null, marked: boolean, i: number, pointer: Pointer) {
  const shade = cell ? (SHADES[cell.tone][cell.level] ?? "") : "bg-transparent";
  // White for the minute read, held or hovered (cyan would vanish on the climbing cells).
  const read = !pointer.readLine && (pointer.pinned ?? pointer.hovered) === i;
  const outline = read
    ? "outline-2 outline-ecam-white"
    : marked
      ? "outline-1 outline-ecam-amber"
      : "";
  return `h-3 rounded-[1px] ${shade} ${outline}`;
}

export interface RowsProps {
  bands: Bands;
  pointer: Pointer;
  /** Minutes the shades are measured on (the whole flight on a zoom); default `bands.minutes`. */
  scale?: Bands["minutes"] | undefined;
}

/** The cells of one row, one per minute; `className` dims a row that never changes. */
export function RowCells({
  bands,
  row,
  pointer,
  scale,
  className = "",
}: RowsProps & { row: BandRow; className?: string }) {
  const marks = bands.marks ?? [];
  return (
    <div
      className={`grid gap-px ${className}`}
      style={{ gridTemplateColumns: `repeat(${bands.minutes.length}, minmax(0, 1fr))` }}
    >
      {bandCells(bands.minutes, row, scale).map((cell, i) => (
        <span
          key={i}
          className={cellClass(
            cell,
            marks.some((m) => m.row === row && i >= m.from && i <= m.to),
            i,
            pointer,
          )}
        />
      ))}
    </div>
  );
}

/** One row: abbreviation (full name on hover), then one cell per minute. */
function Row({ row, ...props }: RowsProps & { row: BandRow }) {
  const rows = useTranslations("Logbook.bands.rows");
  const short = useTranslations("Logbook.bands.shortRows");
  return (
    <>
      <abbr title={rows(row)} className="cursor-help truncate pr-2 text-[12.5px] no-underline">
        {short(row)}
      </abbr>
      <RowCells row={row} {...props} />
    </>
  );
}

/**
 * The rows by group (TRAJ, CMD, FEUX / CAB), groups without any value left out; `renderRow`
 * replaces the plain row (the ECAM page adds the range and the curve).
 */
export function Groups({
  bands,
  pointer,
  scale,
  renderRow,
}: RowsProps & { renderRow?: (row: BandRow) => ReactNode }) {
  const groups = useTranslations("Logbook.ecam.groups");
  return BAND_GROUPS.map(({ key, rows }) => {
    const shown = rows.filter((row) => bands.rows.includes(row));
    if (shown.length === 0) return null;
    return (
      <Fragment key={key}>
        <span className="col-span-full mt-2 text-[11.5px] tracking-[.08em] text-ecam-cyan">
          <span className="border-b border-ecam-cyan">{groups(key)}</span>
        </span>
        {shown.map((row) =>
          renderRow ? (
            <Fragment key={row}>{renderRow(row)}</Fragment>
          ) : (
            <Row key={row} bands={bands} row={row} pointer={pointer} scale={scale} />
          ),
        )}
      </Fragment>
    );
  });
}
