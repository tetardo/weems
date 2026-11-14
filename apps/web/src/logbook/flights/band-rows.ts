import type { BandRow } from "@weems/contrats";

/** Groups of rows of the flight bands, in display order (maquette v8). */
export const BAND_GROUPS: readonly { key: "trajectory" | "controls" | "cabin"; rows: BandRow[] }[] =
  [
    { key: "trajectory", rows: ["altitude", "speed", "verticalSpeed", "bank", "gForce"] },
    {
      key: "controls",
      rows: ["n1", "flaps", "gear", "spoilers", "braking", "parkingBrake", "autopilot"],
    },
    {
      key: "cabin",
      rows: ["landingLight", "beacon", "strobe", "seatbelts", "cabinAltitude", "cabinRate"],
    },
  ];

type Shown = { key: string; value: number };

/** Switches: on, off, or the share of the minute when on. */
const SWITCHES: ReadonlySet<BandRow> = new Set([
  "parkingBrake",
  "autopilot",
  "landingLight",
  "beacon",
  "strobe",
  "seatbelts",
]);

const SPECIAL: Partial<Record<BandRow, (value: number) => Shown>> = {
  gear: (value) => ({ key: value >= 0.5 ? "gearDown" : "gearUp", value }),
  spoilers: (value) => ({ key: "percent", value: Math.round(value * 100) }),
  gForce: (value) => ({ key: "g", value: Math.round(value * 100) / 100 }),
  braking: (value) => ({ key: "ktPerS", value: Math.round(value * 10) / 10 }),
};

function switchValue(value: number): Shown {
  if (value === 0 || value === 1) return { key: value === 1 ? "on" : "off", value };
  return { key: "share", value: Math.round(value * 100) };
}

/** Value of a row as written in the hover panel, with its unit (keys of Logbook.bands.values). */
export function bandValue(row: BandRow, value: number): Shown {
  if (SWITCHES.has(row)) return switchValue(value);
  return SPECIAL[row]?.(value) ?? { key: row, value: Math.round(value) };
}
