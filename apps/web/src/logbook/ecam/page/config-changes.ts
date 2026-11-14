import type { BandMinute, BandRow } from "@weems/contrats";

/** A change of configuration on the CONFIG row: gear, flaps, autopilot (Greg, idea 9). */
export interface ConfigChange {
  minute: number;
  code: string;
  /** The autopilot let go: amber, as on a cockpit. */
  amber: boolean;
}

/** State of a row at a minute, as the CONFIG row reads it; null when unknown. */
const STATES: Partial<Record<BandRow, (value: number) => string>> = {
  gear: (v) => (v >= 0.5 ? "GEAR DN" : "GEAR UP"),
  flaps: (v) => `FLAPS ${Math.round(v)}`,
  autopilot: (v) => (v >= 0.5 ? "AP ON" : "AP OFF"),
};

/** Every change of gear, flaps and autopilot from one minute to the next, in flight order. */
export function configChanges(minutes: readonly BandMinute[]): ConfigChange[] {
  const changes: ConfigChange[] = [];
  for (const [row, state] of Object.entries(STATES) as [BandRow, (v: number) => string][]) {
    let before: string | null = null;
    minutes.forEach((m, minute) => {
      const value = m.values[row];
      if (value === null || value === undefined) return;
      const now = state(value);
      if (before !== null && now !== before) {
        changes.push({ minute, code: now, amber: now === "AP OFF" });
      }
      before = now;
    });
  }
  return changes.sort((a, b) => a.minute - b.minute);
}
