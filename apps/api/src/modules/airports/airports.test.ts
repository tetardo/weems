import { describe, expect, it } from "vitest";
import { formatAirportsFile, parseAirportsFile, readAirportsFile } from "./airports-file.ts";
import { airportsFromOurAirports, shortAirportName, splitCsvLine } from "./ourairports.ts";
import { AirportsService } from "./service.ts";

const HEADER =
  '"id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","iso_country","icao_code","iata_code","gps_code"';
const ourAirports = [
  HEADER,
  '4185,"LFPG","large_airport","Charles de Gaulle International Airport",49.00896,2.554117,392,"FR","LFPG","CDG","LFPG"',
  '9,"US-0001","small_airport","Farm ""Strip"", North",40.123456,-74.5,,"US",,,"K00X"',
  '10,"K00X","heliport","Owns its code",41,-75,12.4,"US",,"0",',
  '11,"LFXX","closed","Old field",45,5,,"FR",,,',
  '12,"FR-0042","small_airport","No usable code",45,5,,"FR",,,',
].join("\n");

const CDG = {
  icao: "LFPG",
  name: "Charles de Gaulle International Airport",
  shortName: "Charles de Gaulle",
  iata: "CDG",
  country: "FR",
  elevationFt: 392,
  lat: 49.009,
  lon: 2.5541,
};
const FARM = {
  icao: "K00X",
  name: 'Farm "Strip", North',
  shortName: 'Farm "Strip", North',
  iata: null,
  country: "US",
  elevationFt: null,
  lat: 40.1235,
  lon: -74.5,
};

describe("OurAirports list", () => {
  it("splits quoted fields with commas and escaped quotes", () => {
    expect(splitCsvLine('1,"a, ""b""",,c')).toEqual(["1", 'a, "b"', "", "c"]);
  });

  it("keeps open airports by identifier, then by free ICAO or GPS code, rounded to 4 decimals", () => {
    expect(airportsFromOurAirports(ourAirports)).toEqual([
      {
        icao: "K00X",
        name: "Owns its code",
        shortName: "Owns its code",
        iata: null, // « 0 » is not an IATA code
        country: "US",
        elevationFt: 12,
        lat: 41,
        lon: -75,
      },
      CDG,
    ]);
  });

  it("drops the kind of place at the end of the name, never the whole name", () => {
    expect(shortAirportName("Marseille Provence Airport")).toBe("Marseille Provence");
    expect(shortAirportName("Nice Côte d'Azur International Airport")).toBe("Nice Côte d'Azur");
    expect(shortAirportName("Lyon-Bron Aerodrome")).toBe("Lyon-Bron");
    expect(shortAirportName("Istres Le Tubé Air Base")).toBe("Istres Le Tubé Air Base");
    expect(shortAirportName("Airport")).toBe("Airport");
  });
});

describe("airport file", () => {
  it("reads back what it writes, names with commas and quotes included", () => {
    const airports = [FARM, CDG];
    expect([...parseAirportsFile(formatAirportsFile(airports)).values()]).toEqual(airports);
  });

  it("ships with the airports of the simulated flights", () => {
    const airports = readAirportsFile();
    expect(airports.get("LFPG")).toEqual(CDG);
    expect(airports.get("LFML")).toMatchObject({ shortName: "Marseille Provence", iata: "MRS" });
    expect(airports.size).toBeGreaterThan(40_000);
  });
});

describe("airports service", () => {
  const service = new AirportsService(parseAirportsFile(formatAirportsFile([CDG])));

  it("finds an airport whatever the case, and answers null for unknown or missing codes", () => {
    expect(service.find("lfpg")).toMatchObject({ icao: "LFPG" });
    expect(service.find("ZZZZ")).toBeNull();
    expect(service.find(null)).toBeNull();
  });
});
