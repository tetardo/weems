import { type Navaid, NavaidType } from "@weems/contrats";
import { type CsvRow, decimal, integer, parseCsv, text } from "./csv.ts";

const COUNTRY = /^[A-Z]{2}$/;

function dmeOf(get: CsvRow): Navaid["dme"] {
  const frequencyKhz = decimal(get("dme_frequency_khz"));
  const channel = text(get("dme_channel"));
  if (frequencyKhz === null && channel === null) return null;
  return {
    frequencyKhz,
    channel,
    lat: decimal(get("dme_latitude_deg")),
    lon: decimal(get("dme_longitude_deg")),
    elevationFt: integer(get("dme_elevation_ft")),
  };
}

/** Radio aids of the OurAirports `navaids.csv` file, the whole world (decision 023). */
export function navaidsFromOurAirports(csv: string): Navaid[] {
  return parseCsv(csv).flatMap((get) => {
    const type = NavaidType.safeParse(get("type"));
    const country = get("iso_country");
    const lat = Number(get("latitude_deg"));
    const lon = Number(get("longitude_deg"));
    if (!type.success || !COUNTRY.test(country) || !get("latitude_deg")) return [];
    return [
      {
        ident: get("ident"),
        name: get("name"),
        type: type.data,
        frequencyKhz: decimal(get("frequency_khz")),
        lat,
        lon,
        elevationFt: integer(get("elevation_ft")),
        country,
        dme: dmeOf(get),
        slavedVariationDeg: decimal(get("slaved_variation_deg")),
        magneticVariationDeg: decimal(get("magnetic_variation_deg")),
        usage: text(get("usageType")),
        power: text(get("power")),
        airport: text(get("associated_airport")),
      },
    ];
  });
}
