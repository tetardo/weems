import { z } from "zod";
import { Latitude, Longitude } from "../telemetry/common.ts";
import { IcaoCode } from "./common.ts";

/** An airport, from the API's airport list (OurAirports, decisions 005 and 023). */
export const Airport = z.object({
  icao: IcaoCode,
  /** Official name, in English: « Marseille Provence Airport ». */
  name: z.string(),
  /** Name without its kind, for a list or a board: « Marseille Provence ». */
  shortName: z.string(),
  /** IATA code (« MRS »); null for most small fields. */
  iata: z
    .string()
    .regex(/^[A-Z0-9]{3}$/)
    .nullable(),
  /** ISO 3166-1 alpha-2 country code (« FR »); the site writes the country in the page's language. */
  country: z.string().regex(/^[A-Z]{2}$/),
  /** Field elevation in feet; null when OurAirports does not give it. */
  elevationFt: z.number().int().nullable(),
  lat: Latitude,
  lon: Longitude,
});
export type Airport = z.infer<typeof Airport>;

/** At most this many codes per request: the live map asks only for the codes it does not know yet. */
export const MAX_AIRPORT_CODES = 100;

/** GET /v1/airports?codes=LFPG,LFBO: codes separated by commas. */
export const AirportsQuery = z.object({
  codes: z
    .string()
    .transform((codes) => [...new Set(codes.split(",").filter((code) => code.length > 0))])
    .pipe(z.array(IcaoCode).min(1).max(MAX_AIRPORT_CODES)),
});
export type AirportsQuery = z.infer<typeof AirportsQuery>;

/** Answer of GET /v1/airports: the airports found; unknown codes are simply absent. */
export const AirportList = z.object({ airports: z.array(Airport) });
export type AirportList = z.infer<typeof AirportList>;
