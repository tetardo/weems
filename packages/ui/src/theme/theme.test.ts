import { describe, expect, it } from "vitest";
import { resolveTheme, themeScript } from "./theme.ts";

describe("resolveTheme", () => {
  it("keeps the visitor's choice over the system setting", () => {
    expect(resolveTheme("light", false)).toBe("light");
    expect(resolveTheme("dark", true)).toBe("dark");
  });

  it("follows the system when there is no valid choice", () => {
    expect(resolveTheme(null, true)).toBe("light");
    expect(resolveTheme(null, false)).toBe("dark");
    expect(resolveTheme("blue", true)).toBe("light");
  });
});

describe("themeScript", () => {
  function run(storageKey: string, stored: Record<string, string>) {
    const root = { dataset: {} as Record<string, string> };
    new Function("document", "window", "localStorage", themeScript(storageKey))(
      { documentElement: root },
      { matchMedia: () => ({ matches: false }) },
      { getItem: (key: string) => stored[key] ?? null },
    );
    return root.dataset.theme;
  }

  it("sets the theme of the page from the choice stored under the application's key", () => {
    expect(run("weems-theme", { "weems-theme": "light" })).toBe("light");
  });

  it("ignores the choice stored under another key", () => {
    expect(run("weems-console-theme", { "weems-theme": "light" })).toBe("dark");
  });
});
