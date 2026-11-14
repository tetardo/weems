import { describe, expect, it } from "vitest";
import { formatNavaidsFile, parseNavaidsFile, readNavaidsFile } from "./navaids-file.ts";
import { NavaidsService } from "./navaids-service.ts";
import { navaidsFromOurAirports } from "./ourairports-navaids.ts";
import { formatWikidataFile, wikidataNames, withWikidataNames } from "./wikidata-names.ts";
import { CDG } from "./airports.test.ts";

const NAVAIDS = [
  '"id","filename","ident","name","type","frequency_khz","latitude_deg","longitude_deg","elevation_ft","iso_country","dme_frequency_khz","dme_channel","dme_latitude_deg","dme_longitude_deg","dme_elevation_ft","slaved_variation_deg","magnetic_variation_deg","usageType","power","associated_airport"',
  '1,"x","MRM","Martigues","VOR-DME",108800,43.3842,5.1569,,"FR",108800,"025X",,,,1.0,2.5,"BOTH","HIGH",',
  '2,"x","ML","Marseille","NDB",369,43.43,5.21,70,"FR",,,,,,,2.4,"TERMINAL","LOW","LFML"',
  '3,"x","ZZ","Unknown kind","MARKER",75000,43,5,,"FR",,,,,,,,,,',
].join("\n");

describe("OurAirports radio aids", () => {
  const navaids = navaidsFromOurAirports(NAVAIDS);

  it("keeps the known kinds, frequencies in kHz, DME paired on the same line", () => {
    expect(navaids.map((navaid) => navaid.ident)).toEqual(["MRM", "ML"]);
    expect(navaids[0]).toMatchObject({
      type: "VOR-DME",
      frequencyKhz: 108800,
      dme: { frequencyKhz: 108800, channel: "025X", lat: null },
      airport: null,
    });
    expect(navaids[1]).toMatchObject({
      type: "NDB",
      frequencyKhz: 369,
      dme: null,
      airport: "LFML",
    });
  });

  it("reads back what the file holds, and ships with the world's aids", () => {
    expect(parseNavaidsFile(formatNavaidsFile(navaids))).toEqual(navaids);
    expect(readNavaidsFile().length).toBeGreaterThan(10_000);
  });

  it("finds the aids around a point, nearest first, within the radius", () => {
    const service = new NavaidsService(navaids);
    const near = service.near({ lat: 43.44, lon: 5.21, radiusNm: 10 });
    expect(near.map((navaid) => navaid.ident)).toEqual(["ML", "MRM"]);
    expect(service.near({ lat: 43.44, lon: 5.21, radiusNm: 1 }).map((n) => n.ident)).toEqual([
      "ML",
    ]);
  });
});

describe("Wikidata names", () => {
  const answer = [
    "icao,nameFr,cityEn,cityFr",
    "LFPG,aéroport Paris-Charles-de-Gaulle,Paris,Paris",
    "LFPG,doublon ignoré,,",
    "lfml,aéroport de Marseille-Provence,,",
    "XX,trop court,,",
  ].join("\n");

  it("keeps the first line of each ICAO code, and reads back what it writes", () => {
    const names = wikidataNames(answer);
    expect([...names.keys()]).toEqual(["LFPG", "LFML"]);
    expect(names.get("LFML")).toEqual({
      nameFr: "aéroport de Marseille-Provence",
      cityEn: null,
      cityFr: null,
    });
    expect(wikidataNames(formatWikidataFile(names))).toEqual(
      new Map([...names].sort(([a], [b]) => a.localeCompare(b))),
    );
  });

  it("adds the names to the airports found by code, the others unchanged", () => {
    const named = withWikidataNames(new Map([["LFPG", CDG]]), wikidataNames(answer));
    expect(named.get("LFPG")).toMatchObject({
      nameFr: "aéroport Paris-Charles-de-Gaulle",
      cityEn: "Paris",
    });
    expect(withWikidataNames(new Map([["LFPG", CDG]]), new Map()).get("LFPG")).toEqual(CDG);
  });
});
