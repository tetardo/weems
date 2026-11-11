import { describe, expect, it } from "vitest";
import { formatAirportsFile, parseAirportsFile, readAirportsFile } from "./airports-file.ts";
import { airportsFromOurAirports, splitCsvLine } from "./ourairports.ts";
import { AirportsService } from "./service.ts";

const HEADER =
  '"id","ident","type","name","latitude_deg","longitude_deg","icao_code","iata_code","gps_code"';
const ourAirports = [
  HEADER,
  '4185,"LFPG","large_airport","Charles de Gaulle International Airport",49.00896,2.554117,"LFPG","CDG","LFPG"',
  '9,"US-0001","small_airport","Farm ""Strip"", North",40.123456,-74.5,,,"K00X"',
  '10,"K00X","heliport","Owns its code",41,-75,,,',
  '11,"LFXX","closed","Old field",45,5,,,',
  '12,"FR-0042","small_airport","No usable code",45,5,,,',
].join("\n");

describe("OurAirports list", () => {
  it("splits quoted fields with commas and escaped quotes", () => {
    expect(splitCsvLine('1,"a, ""b""",,c')).toEqual(["1", 'a, "b"', "", "c"]);
  });

  it("keeps open airports by identifier, then by free ICAO or GPS code, rounded to 4 decimals", () => {
    expect(airportsFromOurAirports(ourAirports)).toEqual([
      { icao: "K00X", name: "Owns its code", lat: 41, lon: -75 },
      { icao: "LFPG", name: "Charles de Gaulle International Airport", lat: 49.009, lon: 2.5541 },
    ]);
  });
});

describe("airport file", () => {
  it("reads back what it writes, names with commas included", () => {
    const airports = [{ icao: "K00X", name: 'Farm "Strip", North', lat: 40.1235, lon: -74.5 }];
    expect([...parseAirportsFile(formatAirportsFile(airports)).values()]).toEqual(airports);
  });

  it("ships with the airports of the simulated flights", () => {
    const airports = readAirportsFile();
    expect(airports.get("LFPG")).toMatchObject({ lat: 49.009, lon: 2.5541 });
    expect(airports.size).toBeGreaterThan(40_000);
  });
});

describe("airports service", () => {
  const service = new AirportsService(
    parseAirportsFile(formatAirportsFile([{ icao: "LFPG", name: "CDG", lat: 49, lon: 2.5 }])),
  );

  it("finds an airport whatever the case, and answers null for unknown or missing codes", () => {
    expect(service.find("lfpg")).toMatchObject({ icao: "LFPG" });
    expect(service.find("ZZZZ")).toBeNull();
    expect(service.find(null)).toBeNull();
  });
});
