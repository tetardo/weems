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
  /** French name (Wikidata, CC0): « Aéroport de Marseille-Provence »; null when unknown. */
  nameFr: z.string().nullable(),
  /** City the airport serves (Wikidata), in English and in French; null when unknown. */
  cityEn: z.string().nullable(),
  cityFr: z.string().nullable(),
  /** IATA code (« MRS »); null for most small fields. */
  iata: z
    .string()
    .regex(/^[A-Z0-9]{3}$/)
    .nullable(),
  /** ISO 3166-1 alpha-2 country code (« FR »); the site writes the country in the page's language. */
  country: z.string().regex(/^[A-Z]{2}$/),
  /** Field elevation in feet; null when OurAirports does not give it. */
  elevationFt: z.number().int().nullable(),
  /** IANA time zone of the field (« Europe/Paris »), found from its position. */
  timezone: z.string(),
  lat: Latitude,
  lon: Longitude,
});
export type Airport = z.infer<typeof Airport>;

/** Kind of place, as OurAirports names it. */
export const AirportType = z.enum([
  "large_airport",
  "medium_airport",
  "small_airport",
  "seaplane_base",
  "heliport",
]);
export type AirportType = z.infer<typeof AirportType>;

/** One end of a runway: the threshold a pilot lands on, named « 13L ». */
export const RunwayEnd = z.object({
  ident: z.string(),
  lat: Latitude.nullable(),
  lon: Longitude.nullable(),
  elevationFt: z.number().int().nullable(),
  /** Runway heading from true north, as OurAirports gives it. */
  headingTrueDeg: z.number().nullable(),
  /** Heading from magnetic north (World Magnetic Model 2025-2030, at the date of the list). */
  headingMagneticDeg: z.number().nullable(),
  displacedThresholdFt: z.number().int().nullable(),
});
export type RunwayEnd = z.infer<typeof RunwayEnd>;

export const Runway = z.object({
  lengthFt: z.number().int().nullable(),
  widthFt: z.number().int().nullable(),
  /** Surface code as OurAirports gives it (« ASP », « GRS », « CON »…): not normalised. */
  surface: z.string().nullable(),
  lighted: z.boolean(),
  closed: z.boolean(),
  /** Usually two; one for a helipad or a one-way strip. */
  ends: z.array(RunwayEnd),
});
export type Runway = z.infer<typeof Runway>;

/** A radio frequency of the airport (real world: it may differ from the simulator's). */
export const AirportFrequency = z.object({
  /** « TWR », « ATIS », « GND »… as OurAirports gives it. */
  type: z.string(),
  description: z.string(),
  mhz: z.number(),
});
export type AirportFrequency = z.infer<typeof AirportFrequency>;

/** Kind of radio navigation aid, as OurAirports names it. */
export const NavaidType = z.enum(["VOR", "VOR-DME", "VORTAC", "DME", "NDB", "NDB-DME", "TACAN"]);
export type NavaidType = z.infer<typeof NavaidType>;

/** A radio navigation aid (OurAirports, real world: it may differ from the simulator's). */
export const Navaid = z.object({
  /** Identifier heard in Morse (« MRM »); not unique in the world. */
  ident: z.string(),
  name: z.string(),
  type: NavaidType,
  /** kHz for every kind: 112300 for a VOR on 112.30 MHz, 373 for an NDB on 373 kHz. */
  frequencyKhz: z.number().nullable(),
  lat: Latitude,
  lon: Longitude,
  elevationFt: z.number().int().nullable(),
  country: z.string().regex(/^[A-Z]{2}$/),
  /** Paired DME, when there is one. */
  dme: z
    .object({
      frequencyKhz: z.number().nullable(),
      /** TACAN channel (« 070X »). */
      channel: z.string().nullable(),
      lat: Latitude.nullable(),
      lon: Longitude.nullable(),
      elevationFt: z.number().int().nullable(),
    })
    .nullable(),
  /** Declination the VOR is aligned on, in degrees east. */
  slavedVariationDeg: z.number().nullable(),
  /** Declination at the station when OurAirports recorded it, in degrees east. */
  magneticVariationDeg: z.number().nullable(),
  /** « HI », « LO », « BOTH », « TERMINAL », « RNAV » as OurAirports gives it. */
  usage: z.string().nullable(),
  /** « HIGH », « MEDIUM », « LOW » as OurAirports gives it. */
  power: z.string().nullable(),
  /** Code of the airport it serves, when there is one. */
  airport: z.string().nullable(),
});
export type Navaid = z.infer<typeof Navaid>;

/** GET /v1/navaids?lat=43.4&lon=5.2&radiusNm=50: the aids around a point, nearest first. */
export const NavaidsQuery = z.object({
  lat: z.coerce.number().pipe(Latitude),
  lon: z.coerce.number().pipe(Longitude),
  radiusNm: z.coerce.number().positive().max(250).default(50),
});
export type NavaidsQuery = z.infer<typeof NavaidsQuery>;

export const NavaidList = z.object({ navaids: z.array(Navaid) });
export type NavaidList = z.infer<typeof NavaidList>;

/** GET /v1/airports/{icao}: everything known about one airport. */
export const AirportDetail = Airport.extend({
  type: AirportType,
  continent: z.string().regex(/^[A-Z]{2}$/),
  /** Country name in English (OurAirports); the site may prefer the browser's translation. */
  countryName: z.string().nullable(),
  /** ISO 3166-2 region code (« FR-PAC ») and its name. */
  region: z.string(),
  regionName: z.string().nullable(),
  /** The airport has airline service. */
  scheduledService: z.boolean(),
  wikipediaLink: z.string().nullable(),
  homeLink: z.string().nullable(),
  /** Other names and codes (« Roissy », « Londres »), for a search. */
  keywords: z.array(z.string()),
  runways: z.array(Runway),
  frequencies: z.array(AirportFrequency),
  /** Radio aids that OurAirports ties to this airport. */
  navaids: z.array(Navaid),
});
export type AirportDetail = z.infer<typeof AirportDetail>;

/** Path of GET /v1/airports/{icao}. */
export const AirportParams = z.object({ icao: IcaoCode });
export type AirportParams = z.infer<typeof AirportParams>;

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
