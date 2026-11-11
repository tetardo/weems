import { CountryCode } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { COUNTRY_CODES, countriesByName, countryName } from "./countries.ts";

describe("countries", () => {
  it("are all valid codes, once each", () => {
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length);
    for (const code of COUNTRY_CODES) expect(CountryCode.safeParse(code).success).toBe(true);
  });

  it("are named and sorted in the language of the page", () => {
    expect(countryName("DE", "fr")).toBe("Allemagne");
    expect(countryName("DE", "en")).toBe("Germany");
    const names = countriesByName("fr").map((c) => c.name);
    expect(names.indexOf("Allemagne")).toBeLessThan(names.indexOf("France"));
  });
});
