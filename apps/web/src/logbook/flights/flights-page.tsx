import type { FlightBands, LogbookEntry, TrackView } from "@weems/contrats";
import type { EntryFilter } from "./entry-filter.ts";
import { EntryList } from "./entry-list.tsx";
import { FlightSheet } from "./flight-sheet.tsx";
import { FlightsHeader } from "./flights-header.tsx";

interface Props {
  entries: readonly LogbookEntry[];
  /** Every flight of the pilot, before the filter. */
  total: number;
  filter: EntryFilter;
  /** The flight of the sheet, with its bands and trajectory; null when the list is empty. */
  selected: { entry: LogbookEntry; bands: FlightBands | null; track: TrackView | null } | null;
  /** The address names a flight: on phones the sheet takes the page, else the list does. */
  sheetFirst: boolean;
}

/**
 * Page Vols of the private logbook (maquette v8, B): the list on the left, the sheet of the
 * selected flight on the right; one of the two on phones.
 */
export function FlightsPage({ entries, total, filter, selected, sheetFirst }: Props) {
  return (
    <div className="grid gap-4">
      <div className={sheetFirst ? "max-lg:hidden" : ""}>
        <FlightsHeader total={total} filter={filter} />
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className={`lg:sticky lg:top-24 ${sheetFirst ? "max-lg:hidden" : ""}`}>
          <EntryList
            entries={entries}
            selectedId={selected?.entry.flight.flightId ?? null}
            filter={filter}
          />
        </div>
        {selected && (
          <div className={sheetFirst ? "" : "max-lg:hidden"}>
            <FlightSheet entry={selected.entry} bands={selected.bands} track={selected.track} />
          </div>
        )}
      </div>
    </div>
  );
}
