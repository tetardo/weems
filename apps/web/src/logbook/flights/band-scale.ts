import type { BandMinute, BandRow } from "@weems/contrats";

/** Shade of a cell: 0 nothing (off, idle, not recorded), 1 to 4 low to high. */
export interface Cell {
  level: 0 | 1 | 2 | 3 | 4;
  /** Vertical speed only: climbing or descending colours. */
  tone: "value" | "climb" | "descent";
}

/** Rows whose value is already a share from 0 to 1 (switches, gear, spoilers). */
const ABSOLUTE: ReadonlySet<BandRow> = new Set([
  "gear",
  "spoilers",
  "parkingBrake",
  "autopilot",
  "landingLight",
  "seatbelts",
]);

const levelOf = (share: number): Cell["level"] =>
  share <= 0 ? 0 : (Math.min(4, Math.max(1, Math.ceil(share * 4))) as Cell["level"]);

/** Values read as the lowest and highest shade of a row. */
function rangeOf(row: BandRow, known: readonly number[]): [number, number] {
  if (ABSOLUTE.has(row)) return [0, 1];
  if (row === "flaps") return [0, Math.max(1, ...known)];
  return [Math.min(...known), Math.max(...known)];
}

/**
 * Cells of one row of the bands. Shares are read as they are; flaps against the highest setting
 * of the flight; vertical speed by its size, climbing or descending; the other rows from the
 * lowest to the highest value of the flight.
 */
export function bandCells(minutes: readonly BandMinute[], row: BandRow): (Cell | null)[] {
  const values = minutes.map((m) => m.values[row] ?? null);
  const known = values.filter((v): v is number => v !== null);
  if (row === "verticalSpeed") {
    const top = Math.max(1, ...known.map(Math.abs));
    return values.map((v) =>
      v === null ? null : { level: levelOf(Math.abs(v) / top), tone: v >= 0 ? "climb" : "descent" },
    );
  }
  const [low, high] = rangeOf(row, known);
  const span = high - low || 1;
  return values.map((v) =>
    v === null ? null : { level: levelOf((v - low) / span), tone: "value" },
  );
}
