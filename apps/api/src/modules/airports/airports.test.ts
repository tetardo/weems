import { describe, expect, it } from "vitest";
import type { AirportRecord } from "./airport-record.ts";
import { formatAirportsFile, parseAirportsFile, readAirportsFile } from "./airports-file.ts";
import { formatCsv, parseCsv, splitCsvLine } from "./csv.ts";
import { airportsFromOurAirports, shortAirportName } from "./ourairports.ts";
import { AirportsService } from "./service.ts";

const HEADER =
  '"id","ident","type","name","latitude_deg","longitude_deg","elevation_ft","continent","iso_country","iso_region","scheduled_service","icao_code","iata_code","gps_code","home_link","wikipedia_link","keywords"';
const ourAirports = [
  HEADER,
  '4185,"LFPG","large_airport","Charles de Gaulle International Airport",49.00896,2.554117,392,"EU","FR","FR-IDF","yes","LFPG","CDG","LFPG","http://www.aeroportsdeparis.fr/","https://en.wikipedia.org/wiki/Charles_de_Gaulle_Airport","PAR, Roissy"',
  '9,"US-0001","small_airport","Farm ""Strip"", North",40.123456,-74.5,,"NA","US","US-NJ","no",,,"K00X",,,',
  '10,"K00X","heliport","Owns its code",41,-75,12.4,"NA","US","US-PA","no",,"0",,,,',
  '11,"LFXX","closed","Old field",45,5,,"EU","FR","FR-ARA","no",,,,,,',
  '12,"FR-0042","small_airport","No usable code",45,5,,"EU","FR","FR-ARA","no",,,,,,',
].join("\n");
const regions = ['"id","code","name"', '1,"FR-IDF","Île-de-France"'].join("\n");

export const CDG: AirportRecord = {
  icao: "LFPG",
  ident: "LFPG",
  name: "Charles de Gaulle International Airport",
  shortName: "Charles de Gaulle",
  iata: "CDG",
  country: "FR",
  elevationFt: 392,
  timezone: "Europe/Paris",
  lat: 49.009,
  lon: 2.5541,
  type: "large_airport",
  continent: "EU",
  region: "FR-IDF",
  regionName: "Île-de-France",
  scheduledService: true,
  wikipediaLink: "https://en.wikipedia.org/wiki/Charles_de_Gaulle_Airport",
  homeLink: "http://www.aeroportsdeparis.fr/",
  keywords: ["PAR", "Roissy"],
};
const FARM: AirportRecord = {
  icao: "K00X",
  ident: "US-0001",
  name: 'Farm "Strip", North',
  shortName: 'Farm "Strip", North',
  iata: null,
  country: "US",
  elevationFt: null,
  timezone: "America/New_York",
  lat: 40.1235,
  lon: -74.5,
  type: "small_airport",
  continent: "NA",
  region: "US-NJ",
  regionName: null,
  scheduledService: false,
  wikipediaLink: null,
  homeLink: null,
  keywords: [],
};

describe("CSV", () => {
  it("splits quoted fields with commas and escaped quotes", () => {
    expect(splitCsvLine('1,"a, ""b""",,c')).toEqual(["1", 'a, "b"', "", "c"]);
  });

  it("reads back what it writes", () => {
    const csv = formatCsv(
      ["a", "b", "c"],
      [
        ['x, "y"', 1.5, true],
        [null, 0, false],
      ],
    );
    const rows = parseCsv(csv).map((get) => [get("a"), get("b"), get("c"), get("missing")]);
    expect(rows).toEqual([
      ['x, "y"', "1.5", "1", ""],
      ["", "0", "0", ""],
    ]);
  });
});

describe("OurAirports list", () => {
  it("keeps open airports by identifier, then by free ICAO or GPS code, rounded to 4 decimals", () => {
    const airports = airportsFromOurAirports(ourAirports, regions);
    expect(airports.map((airport) => airport.icao)).toEqual(["K00X", "LFPG"]);
    expect(airports[0]).toMatchObject({ ident: "K00X", elevationFt: 12, iata: null }); // « 0 » is no IATA code
    expect(airports[1]).toEqual(CDG);
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
    expect([...parseAirportsFile(formatAirportsFile([FARM, CDG])).values()]).toEqual([FARM, CDG]);
  });

  it("ships with the airports of the simulated flights", () => {
    const airports = readAirportsFile();
    expect(airports.get("LFML")).toMatchObject({
      shortName: "Marseille Provence",
      iata: "MRS",
      timezone: "Europe/Paris",
      region: "FR-PAC",
    });
    expect(airports.size).toBeGreaterThan(40_000);
  });
});

describe("airports service", () => {
  const service = new AirportsService({
    airports: new Map([["LFPG", CDG]]),
    runways: new Map(),
    frequencies: new Map(),
  });

  it("finds an airport whatever the case, and answers null for unknown or missing codes", () => {
    expect(service.find("lfpg")).toMatchObject({ icao: "LFPG", shortName: "Charles de Gaulle" });
    expect(service.find("lfpg")).not.toHaveProperty("runways");
    expect(service.find("ZZZZ")).toBeNull();
    expect(service.find(null)).toBeNull();
  });

  it("gives the detail without the internal identifier, and 404 for an unknown code", () => {
    expect(service.detail("LFPG")).toMatchObject({ runways: [], frequencies: [] });
    expect(service.detail("LFPG")).not.toHaveProperty("ident");
    expect(() => service.detail("ZZZZ")).toThrow("Unknown airport ZZZZ");
  });
});
