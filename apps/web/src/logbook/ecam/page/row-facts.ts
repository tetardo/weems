import type { BandMinute, BandRow, FlightPhase } from "@weems/contrats";
import { ecamValue } from "../ecam-values.ts";

/** Lowest and highest value of a row over a flight, null when it never has one. */
export interface RowRange {
  low: number;
  high: number;
}

export function rowRange(minutes: readonly BandMinute[], row: BandRow): RowRange | null {
  const known = minutes.map((m) => m.values[row] ?? null).filter((v): v is number => v !== null);
  if (known.length === 0) return null;
  return { low: Math.min(...known), high: Math.max(...known) };
}

/** A row that never changes (spoilers always retracted…): dimmed, not hidden. */
export const isFlat = (range: RowRange | null) => range === null || range.low === range.high;

/** The range as a cockpit display writes it: « 800–35 000 FT », or one value when flat. */
export function rangeText(row: BandRow, range: RowRange | null): string {
  if (!range) return "";
  const low = ecamValue(row, range.low);
  const high = ecamValue(row, range.high);
  const unit = high.unit || low.unit;
  const text = low.text === high.text ? high.text : `${low.text}–${high.text}`;
  return unit ? `${text} ${unit}` : text;
}

/** Moments marked on the phase row, with their cockpit codes. */
export type MilestoneKey = "takeoff" | "topOfClimb" | "topOfDescent" | "touchdown";

export const MILESTONE_CODES: Record<MilestoneKey, string> = {
  takeoff: "T/O",
  topOfClimb: "T/C",
  topOfDescent: "T/D",
  touchdown: "TD",
};

/** Phases that start each moment, the first one found wins. */
const STARTS: [MilestoneKey, FlightPhase[]][] = [
  ["takeoff", ["TAKEOFF", "CLIMB"]],
  ["topOfClimb", ["CRUISE"]],
  ["topOfDescent", ["DESCENT"]],
  ["touchdown", ["LANDING", "TAXI_IN"]],
];

/** Minute of the flight where each moment happens, in flight order; missing ones left out. */
export function milestones(minutes: readonly BandMinute[]) {
  const found: { key: MilestoneKey; minute: number }[] = [];
  let from = 0;
  for (const [key, phases] of STARTS) {
    const minute = phases
      .map((phase) => minutes.findIndex((m, i) => i >= from && m.phase === phase))
      .find((i) => i >= 0);
    if (minute === undefined) continue;
    found.push({ key, minute });
    from = minute;
  }
  return found;
}

/** UTC time of a minute as used in the address (?t=06:38). */
export const minuteParam = (minute: BandMinute) => minute.at.slice(11, 16);

/** Minute of the flight named by ?t=hh:mm, or null when none matches. */
export function minuteOfParam(minutes: readonly BandMinute[], param: string | null) {
  if (!param || !/^\d{2}:\d{2}$/.test(param)) return null;
  const i = minutes.findIndex((m) => minuteParam(m) === param);
  return i < 0 ? null : i;
}
