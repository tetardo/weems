import { describe, expect, it } from "vitest";
import { airportOf, SIMULATED_AIRPORTS } from "./airport-data.ts";
import { extractAirports, parseCsv } from "./ourairports-extract.ts";

const AIRPORTS = `"id","ident","type","name","latitude_deg","longitude_deg","elevation_ft"
1,"LSZH","large_airport","Zürich Airport",47.458056,8.548056,1417
2,"XXXX","small_airport","Other, with comma",1,2,3`;

const RUNWAYS = `"id","airport_ref","airport_ident","length_ft","width_ft","surface","lighted","closed","le_ident","le_latitude_deg","le_longitude_deg","le_elevation_ft","le_heading_degT","le_displaced_threshold_ft","he_ident","he_latitude_deg","he_longitude_deg","he_elevation_ft","he_heading_degT","he_displaced_threshold_ft"
1,1,"LSZH",1010,91,"GRASS",0,0,"01H",47.449333,8.54772,,,,"19H",47.451965,8.548985,,
2,1,"LSZH",10827,197,"CON",1,0,"14",47.483101,8.53473,1402,137,492,"32",47.4613,8.56446,1402,317,`;

describe("OurAirports extract", () => {
  it("reads quoted fields with commas", () => {
    expect(parseCsv(AIRPORTS)[1]?.["name"]).toBe("Other, with comma");
  });

  it("keeps the airport elevation and both ends of its hard runways", () => {
    const [zurich] = extractAirports(["LSZH"], AIRPORTS, RUNWAYS);
    expect(zurich).toMatchObject({ icao: "LSZH", elevationFt: 1417 });
    expect(zurich?.runways.map((r) => r.ident)).toEqual(["14", "32"]);
    expect(zurich?.runways[0]).toMatchObject({ headingDeg: 137, displacedThresholdFt: 492 });
  });

  it("gives every simulated airport at least two runway ends", () => {
    expect(SIMULATED_AIRPORTS).toHaveLength(20);
    for (const airport of SIMULATED_AIRPORTS) expect(airport.runways.length).toBeGreaterThan(1);
    expect(() => airportOf("ZZZZ")).toThrow(/airports.json/);
  });
});
