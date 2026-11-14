import type { BandMarkReason, BandRow, FlightBands as Bands, FlightPhase } from "@weems/contrats";
import { BAND_GROUPS } from "../flights/band-rows.ts";

/**
 * Values of the cockpit screen of the flight bands (ECAM look, Greg 14/11/2026): written as on a
 * cockpit display, whatever the language of the site (units in capitals, ON/OFF, UP/DN).
 */
export interface EcamValue {
  text: string;
  unit: string;
  /** green: measured value or system on; white: off, retracted. */
  tone: "green" | "white";
}

/** What the legend shows for one row at one minute. */
export interface EcamCell {
  /** null: no value this minute; "unmeasured": this aircraft does not give it. */
  value: EcamValue | "unmeasured" | null;
  /** A setting changed since the previous minute (flaps, gear, switches…): boxed. */
  changed: boolean;
  trend: "up" | "down" | null;
  /** Inside a stretch to review (Pilot Pro): amber. */
  marked: boolean;
}

/** Columns of the legend in band order; the autopilot goes in the header, as on a FMA. */
export const ECAM_COLUMNS = BAND_GROUPS.map(({ key, rows }) => ({
  key,
  rows: rows.filter((row) => row !== "autopilot"),
}));

/** Phase as a flight mode code. */
export const PHASE_CODES: Record<FlightPhase, string> = {
  BOARDING: "BRD",
  PUSHBACK: "PUSH",
  TAXI_OUT: "TAXI",
  TAKEOFF: "T/O",
  CLIMB: "CLB",
  CRUISE: "CRZ",
  DESCENT: "DES",
  APPROACH: "APP",
  FINAL: "FINAL",
  LANDING: "LDG",
  TAXI_IN: "TAXI",
  ARRIVED: "ARR",
};

/** Settings whose change from one minute to the next is boxed. */
const SETTINGS: ReadonlySet<BandRow> = new Set([
  "flaps",
  "gear",
  "spoilers",
  "parkingBrake",
  "autopilot",
  "landingLight",
  "beacon",
  "strobe",
  "seatbelts",
]);

/** Rows with a trend arrow, and the change per minute read as a trend. */
const TRENDS: Partial<Record<BandRow, number>> = { altitude: 50, speed: 2, cabinAltitude: 50 };

/** Rows a mark could not check because their value is dead on this aircraft (PR #119). */
const RULE_ROWS: Partial<Record<BandMarkReason, BandRow[]>> = {
  beaconOff: ["beacon"],
  strobeOffRunway: ["strobe"],
  landingLightLow: ["landingLight"],
  cabinRate: ["cabinAltitude", "cabinRate"],
};

/** Thousands apart with a space, as on a display: 21 730, -1 060. */
export function grouped(n: number): string {
  const digits = String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return n < 0 && Math.round(n) !== 0 ? `-${digits}` : digits;
}

const signed = (n: number) => (Math.round(n) > 0 ? `+${grouped(n)}` : grouped(n));
const tens = (n: number) => Math.round(n / 10) * 10;
const green = (text: string, unit = ""): EcamValue => ({ text, unit, tone: "green" });
const white = (text: string): EcamValue => ({ text, unit: "", tone: "white" });

/** A switch: ON, OFF, or the share of the minute when on. */
function switchValue(value: number): EcamValue {
  if (value >= 1) return green("ON");
  if (value <= 0) return white("OFF");
  return green(String(Math.round(value * 100)), "%");
}

const FEET = (value: number) => green(grouped(tens(value)), "FT");
const RATE = (value: number) => green(signed(tens(value)), "FT/MN");

/** How each row is written; the switches (lights, seat belts, brakes, autopilot) otherwise. */
const WRITERS: Partial<Record<BandRow, (value: number) => EcamValue>> = {
  altitude: FEET,
  cabinAltitude: FEET,
  verticalSpeed: RATE,
  cabinRate: RATE,
  speed: (value) => green(String(Math.round(value)), "KT"),
  bank: (value) => green(String(Math.round(value)), "°"),
  gForce: (value) => green(value.toFixed(2), "G"),
  n1: (value) => green(value.toFixed(1), "%"),
  flaps: (value) => green(String(Math.round(value))),
  gear: (value) => (value >= 0.5 ? green("DN") : white("UP")),
  spoilers: (value) => (value <= 0 ? white("RET") : green(String(Math.round(value * 100)), "%")),
  braking: (value) => green(value.toFixed(1), "KT/S"),
};

/** One value as a cockpit display writes it. */
export function ecamValue(row: BandRow, value: number): EcamValue {
  return (WRITERS[row] ?? switchValue)(value);
}

/** Rows this aircraft does not give, from the marks that could not be checked. */
export function unmeasuredRows(unmeasured: Bands["unmeasured"]): ReadonlySet<BandRow> {
  return new Set((unmeasured ?? []).flatMap((reason) => RULE_ROWS[reason] ?? []));
}

const valueAt = (bands: Bands, row: BandRow, i: number) => bands.minutes[i]?.values[row] ?? null;

function trendOf(bands: Bands, row: BandRow, i: number): EcamCell["trend"] {
  const step = TRENDS[row];
  const now = valueAt(bands, row, i);
  const before = valueAt(bands, row, i - 1);
  if (step === undefined || now === null || before === null) return null;
  if (now - before >= step) return "up";
  if (before - now >= step) return "down";
  return null;
}

function changedAt(bands: Bands, row: BandRow, i: number): boolean {
  const now = valueAt(bands, row, i);
  const before = valueAt(bands, row, i - 1);
  if (!SETTINGS.has(row) || now === null || before === null) return false;
  return ecamValue(row, now).text !== ecamValue(row, before).text;
}

/** One row of the legend at minute `i`. */
export function ecamCell(
  bands: Bands,
  row: BandRow,
  i: number,
  unmeasured: ReadonlySet<BandRow>,
): EcamCell {
  const marked = (bands.marks ?? []).some((m) => m.row === row && i >= m.from && i <= m.to);
  if (unmeasured.has(row)) return { value: "unmeasured", changed: false, trend: null, marked };
  const value = valueAt(bands, row, i);
  return {
    value: value === null ? null : ecamValue(row, value),
    changed: changedAt(bands, row, i),
    trend: trendOf(bands, row, i),
    marked,
  };
}
