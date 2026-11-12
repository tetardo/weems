import type { LiveFlight } from "@weems/contrats";

/** « LFPG → EGCC » of a flight, dots for an airport not given in the tracker. */
export function FlightRouteCodes({ flight }: { flight: LiveFlight }) {
  return (
    <span className="font-title text-[13px] whitespace-nowrap text-muted">
      {flight.departureIcao ?? "····"} → {flight.plannedArrivalIcao ?? "····"}
    </span>
  );
}
