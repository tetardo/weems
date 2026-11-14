import type { BandMarkReason, FlightBands as Bands } from "@weems/contrats";

/** Marks written as the messages of an E/WD alert area (cockpit English, whatever the language). */
export const ALARM_TEXTS: Record<BandMarkReason, string> = {
  speed250: "IAS > 250 KT BLW FL100",
  bank30: "BANK > 30°",
  sinkRate: "SINK RATE",
  overspeedWarning: "OVERSPEED",
  stallWarning: "STALL",
  beaconOff: "BEACON OFF ENG RUN",
  strobeOffRunway: "STROBE OFF ON RWY",
  landingLightLow: "LDG LT OFF BLW FL100",
  taxiSpeed: "TAXI SPD > 30 KT",
  cabinRate: "CAB V/S EXCESS",
};

/** Short names of the marks that could not be checked, for the N/M line. */
export const UNMEASURED_TEXTS: Record<BandMarkReason, string> = {
  speed250: "IAS",
  bank30: "BANK",
  sinkRate: "V/S",
  overspeedWarning: "OVERSPEED",
  stallWarning: "STALL",
  beaconOff: "BCN",
  strobeOffRunway: "STROBE",
  landingLightLow: "LDG LT",
  taxiSpeed: "TAXI SPD",
  cabinRate: "CAB V/S",
};

/** One alarm: where its stretch starts in the flight, and its message. */
export interface Alarm {
  minute: number;
  reason: BandMarkReason;
}

/** The stretches to review as alarms, one per reason and start, in flight order. */
export function alarmsOf(bands: Bands): Alarm[] {
  const seen = new Set<string>();
  return (bands.marks ?? [])
    .map((m) => ({ minute: m.from, reason: m.reason }))
    .filter((a) => {
      const key = `${a.reason}@${a.minute}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.minute - b.minute);
}
