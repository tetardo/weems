import { describe, expect, it } from "vitest";
import { seededRandom } from "../generate-flights/random.ts";
import { identities } from "./identities.ts";
import { asciiLetters, MAX_PSEUDONYM_LENGTH, pseudonymsOf } from "./pseudonyms.ts";

const callsignsOf = (count: number, seed: number) =>
  identities(count, 1, seededRandom(seed)).map((person) => person.callsign);

describe("pseudonyms of the fictitious pilots", () => {
  it("are the same for the same seed, and differ for another one", () => {
    expect(callsignsOf(50, 1)).toEqual(callsignsOf(50, 1));
    expect(callsignsOf(50, 2)).not.toEqual(callsignsOf(50, 1));
  });

  it("are unique (case ignored), ASCII, and fit the callsign of the API", () => {
    const callsigns = callsignsOf(500, 3);
    expect(new Set(callsigns.map((c) => c.toLowerCase())).size).toBe(500);
    for (const callsign of callsigns) {
      expect(callsign).toMatch(/^[A-Za-z0-9_.]{3,10}$/);
      expect(callsign.length).toBeLessThanOrEqual(MAX_PSEUDONYM_LENGTH);
    }
  });

  it("mix the simulator style and the first name of the pilot, about half and half", () => {
    const people = identities(400, 1, seededRandom(4));
    const withFirstName = people.filter((person) => {
      const first = asciiLetters(person.name.split(" ")[0] ?? "").toLowerCase();
      return person.callsign.toLowerCase().startsWith(first);
    }).length;
    expect(withFirstName / people.length).toBeGreaterThan(0.35);
    expect(withFirstName / people.length).toBeLessThan(0.65);
  });

  it("never look like the old generated callsigns, an airline code or an emergency squawk", () => {
    for (const callsign of callsignsOf(500, 5)) {
      expect(callsign).not.toMatch(/^[A-Z]{3}\d+$/);
      expect(callsign).not.toMatch(/7[567]00/);
    }
  });

  it("stay unique even when every pilot has the same first name and home", () => {
    const same = { firstName: "Léa", lastName: "Roux", country: "FR", homeIcao: "LFBO" };
    const pseudonyms = pseudonymsOf(
      Array.from({ length: 300 }, () => same),
      seededRandom(6),
    );
    expect(new Set(pseudonyms.map((p) => p.toLowerCase())).size).toBe(300);
  });

  it("strip accents and spaces from the names", () => {
    expect(asciiLetters("Tomáš")).toBe("Tomas");
    expect(asciiLetters("de Vries")).toBe("deVries");
  });
});
