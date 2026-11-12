import type { LiveFlight } from "@weems/contrats";
import type { Airports } from "./airport-book.ts";
import { FlightList } from "./flight-list.tsx";
import type { LiveFlights } from "./flights-store.ts";
import { LiveControls, type Switch } from "./live-controls.tsx";
import { LiveSearch } from "./live-search.tsx";
import type { Connection } from "./use-live-flights.ts";

/**
 * Left column of the live map: search, counter and switches, « En vol » list. On a phone, the
 * search and switches stay on top and the list becomes a sheet at the bottom.
 */
export function LiveSidebar({
  flights,
  airports,
  connection,
  routes,
  night,
  onPick,
}: {
  flights: LiveFlights;
  airports: Airports;
  connection: Connection;
  routes: Switch;
  night: Switch;
  onPick: (flight: LiveFlight) => void;
}) {
  return (
    <div className="absolute top-21 left-6 flex w-104 flex-col gap-2 max-md:right-3 max-md:left-3 max-md:w-auto">
      <div className="flex gap-2">
        <LiveSearch flights={flights} onPick={onPick} />
        <div className="md:hidden">
          <LiveControls
            count={flights.size}
            connection={connection}
            routes={routes}
            night={night}
          />
        </div>
      </div>
      <div className="max-md:hidden">
        <LiveControls count={flights.size} connection={connection} routes={routes} night={night} />
      </div>
      <FlightList flights={flights} airports={airports} onPick={onPick} />
    </div>
  );
}
