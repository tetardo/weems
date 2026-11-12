import { describe, expect, it } from "vitest";
import { mapLimited, officialPage, readPackage } from "./registry.ts";

describe("officialPage", () => {
  it("keeps the declared homepage without its #readme", () => {
    expect(officialPage("next", "https://nextjs.org")).toBe("https://nextjs.org/");
    expect(officialPage("jose", "https://github.com/panva/jose#readme")).toBe(
      "https://github.com/panva/jose",
    );
  });

  it("falls back on the npm page for anything that is not a web address", () => {
    expect(officialPage("evil", "javascript:alert(1)")).toBe("https://www.npmjs.com/package/evil");
    expect(officialPage("@types/pg", undefined)).toBe("https://www.npmjs.com/package/@types/pg");
    expect(officialPage("x", "not a url")).toBe("https://www.npmjs.com/package/x");
  });
});

describe("readPackage", () => {
  const document = {
    "dist-tags": { latest: "16.4.6", canary: "16.5.0-canary.3" },
    time: { "16.4.5": "2026-11-01T10:00:00Z", "16.4.6": "2026-11-09T20:33:38Z" },
    homepage: "https://nextjs.org",
  };

  it("takes the latest version, its date and the official page", () => {
    expect(readPackage("next", document)).toEqual({
      latest: "16.4.6",
      releasedAt: "2026-11-09T20:33:38Z",
      homepage: "https://nextjs.org/",
    });
  });

  it("says nothing of a date npm does not give", () => {
    expect(readPackage("next", { "dist-tags": { latest: "1.0.0" } }).releasedAt).toBeNull();
  });

  it("refuses a document without latest version", () => {
    expect(() => readPackage("next", { name: "next" })).toThrow();
  });
});

describe("mapLimited", () => {
  it("keeps the order, never runs more than the limit, turns failures into null", async () => {
    let running = 0;
    let peak = 0;
    const results = await mapLimited([1, 2, 3, 4, 5], 2, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
      if (n === 3) throw new Error("registry down");
      return n * 10;
    });
    expect(results).toEqual([10, 20, null, 40, 50]);
    expect(peak).toBe(2);
  });
});
