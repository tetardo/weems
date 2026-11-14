import type { AirportDetail } from "@weems/contrats";

/**
 * An airport as the API keeps it: everything of GET /v1/airports/{icao} but its runways and
 * frequencies, which are kept apart by OurAirports identifier (`ident`).
 */
export type AirportRecord = Omit<AirportDetail, "runways" | "frequencies"> & { ident: string };
