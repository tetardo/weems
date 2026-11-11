import { describe, expect, it } from "vitest";
import { resolveTheme, THEME_SCRIPT } from "./theme.ts";

describe("resolveTheme", () => {
  it("keeps the pilot's choice over the system setting", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("follows the system when there is no valid choice", () => {
    expect(resolveTheme(null, true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("dark");
    expect(resolveTheme("blue", true)).toBe("light");
  });
});

describe("THEME_SCRIPT", () => {
  it("sets the theme of the page from the stored choice", () => {
    const root = { dataset: {} as Record<string, string> };
    const run = new Function("document", "window", "localStorage", THEME_SCRIPT);
    run(
      { documentElement: root },
      { matchMedia: () => ({ matches: false }) },
      { getItem: () => "light" },
    );
    expect(root.dataset.theme).toBe("light");
  });
});
