import { describe, expect, it } from "vitest";
import { nextLocale } from "./next-locale.ts";

describe("nextLocale", () => {
  it("goes from French to English and back", () => {
    expect(nextLocale(["fr", "en"], "fr")).toBe("en");
    expect(nextLocale(["fr", "en"], "en")).toBe("fr");
  });

  it("follows the list when there are more languages", () => {
    expect(nextLocale(["fr", "en", "de"], "en")).toBe("de");
    expect(nextLocale(["fr", "en", "de"], "de")).toBe("fr");
  });
});
