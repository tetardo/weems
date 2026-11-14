/** Address of the full page of a flight, in the logbook (maquette v13, A). */
export const fullFlightHref = (flightId: string) => `/logbook/flights/${flightId}/full`;

/** Address of the ECAM page of a flight, next to the full page to compare (Greg, 14/11/2026). */
export const ecamFlightHref = (flightId: string) => `/logbook/flights/${flightId}/ecam`;
