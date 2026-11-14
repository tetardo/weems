import { describe, expect, it } from "vitest";
import { formatFrequenciesFile, parseFrequenciesFile } from "./frequencies-file.ts";
import { frequenciesFromOurAirports } from "./ourairports-frequencies.ts";
import { runwaysFromOurAirports } from "./ourairports-runways.ts";
import { formatRunwaysFile, parseRunwaysFile, readRunwaysFile } from "./runways-file.ts";

const RUNWAYS = [
  '"id","airport_ref","airport_ident","length_ft","width_ft","surface","lighted","closed","le_ident","le_latitude_deg","le_longitude_deg","le_elevation_ft","le_heading_degT","le_displaced_threshold_ft","he_ident","he_latitude_deg","he_longitude_deg","he_elevation_ft","he_heading_degT","he_displaced_threshold_ft"',
  '235999,4155,"LFML",11483,148,"ASP",1,0,"13L",43.4491,5.1973,8,133.7,1116,"31R",43.4273,5.2285,53,313.7,2165',
  '1,2,"00A",80,80,"ASPH-G",1,0,"H1",,,,,,,,,,,',
  '3,4,"ZZZZ",1000,20,"GRS",0,1,"09",,,,,,"27",,,,,',
].join("\n");
const FREQUENCIES = [
  '"id","airport_ref","airport_ident","type","description","frequency_mhz"',
  '52540,4155,"LFML","TWR","TWR",118.375',
  '52541,4155,"LFML","CTAF",,122.8',
  '52542,4155,"ZZZZ","TWR","TWR",118.1',
].join("\n");
const KEPT = new Set(["LFML", "00A"]);

describe("OurAirports runways", () => {
  const runways = runwaysFromOurAirports(RUNWAYS, KEPT, new Date("2026-11-14T00:00:00Z"));

  it("keeps the runways of the kept airports, with both ends", () => {
    expect(runways.map(({ airport }) => airport)).toEqual(["LFML", "00A"]);
    expect(runways[0]?.runway).toMatchObject({ lengthFt: 11483, lighted: true, closed: false });
    expect(runways[0]?.runway.ends.map((end) => end.ident)).toEqual(["13L", "31R"]);
    expect(runways[1]?.runway.ends).toEqual([
      {
        ident: "H1",
        lat: null,
        lon: null,
        elevationFt: null,
        headingTrueDeg: null,
        headingMagneticDeg: null,
        displacedThresholdFt: null,
      },
    ]);
  });

  it("works out the magnetic heading from the declination (about 2.8° East at Marseille)", () => {
    const [up, down] = runways[0]?.runway.ends ?? [];
    expect(up?.headingMagneticDeg).toBeCloseTo(130.9, 0);
    expect(down?.headingMagneticDeg).toBeCloseTo(310.9, 0);
  });

  it("reads back what the runway file holds", () => {
    const back = parseRunwaysFile(formatRunwaysFile(runways));
    expect(back.get("LFML")).toEqual([runways[0]?.runway]);
    expect(back.get("00A")).toEqual([runways[1]?.runway]);
  });

  it("ships with the runways of the simulated flights", () => {
    expect(readRunwaysFile().get("LFML")?.length).toBe(2);
  });
});

describe("OurAirports frequencies", () => {
  it("keeps the frequencies of the kept airports, named by their type when they have no description", () => {
    const frequencies = frequenciesFromOurAirports(FREQUENCIES, KEPT);
    expect(frequencies).toEqual([
      { airport: "LFML", frequency: { type: "TWR", description: "TWR", mhz: 118.375 } },
      { airport: "LFML", frequency: { type: "CTAF", description: "CTAF", mhz: 122.8 } },
    ]);
    expect(parseFrequenciesFile(formatFrequenciesFile(frequencies)).get("LFML")).toEqual(
      frequencies.map(({ frequency }) => frequency),
    );
  });
});
