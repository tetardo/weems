import { describe, expect, it } from "vitest";
import { buildReport } from "./build-report.ts";
import type { SecurityAlert } from "./report.ts";

const alert = (library: string, direct: boolean): SecurityAlert => ({
  library,
  severity: "high",
  title: "issue",
  url: "",
  installed: ["0.34.5"],
  patched: ">=0.35.5",
  paths: [],
  direct,
});

const NOW = new Date("2026-11-12T06:38:00Z");
const report = buildReport(
  {
    libraries: [
      { name: "sharp", versions: ["0.34.5"], dev: false, users: ["api"] },
      { name: "@types/node", versions: ["24.19.2"], dev: true, users: ["racine", "web"] },
      { name: "esbuild", versions: ["0.28.2"], dev: true, users: ["tracker"] },
      { name: "zod", versions: ["4.6.8", "4.6.7"], dev: false, users: ["api", "web"] },
    ],
    registry: [
      { latest: "0.35.5", homepage: "https://sharp.pixelplumbing.com/", releasedAt: null },
      { latest: "26.6.6", homepage: "https://github.com/DefinitelyTyped", releasedAt: null },
      null,
      { latest: "4.6.8", homepage: "https://zod.dev/", releasedAt: "2026-10-12T16:29:38Z" },
    ],
    alerts: [alert("sharp", true), alert("sharp", true), alert("esbuild", false)],
    packages: 8,
    auditError: null,
  },
  NOW,
);
const row = (name: string) => report.libraries.find((library) => library.name === name);

describe("buildReport", () => {
  it("dates the check", () => {
    expect(report.checkedAt).toBe("2026-11-12T06:38:00.000Z");
  });

  it("compares the lowest installed version with the latest", () => {
    expect(row("zod")).toMatchObject({ installed: "4.6.7", latest: "4.6.8", gap: "patch" });
    expect(row("sharp")?.gap).toBe("major");
  });

  it("gives the reason of an update held back on purpose", () => {
    expect(row("@types/node")?.held).toBe("suit Node 24 (.nvmrc)");
    expect(row("sharp")?.held).toBeNull();
  });

  it("counts only the advisories on the library itself", () => {
    expect(row("sharp")?.alerts).toBe(2);
    expect(row("esbuild")?.alerts).toBe(0);
  });

  it("keeps a library npm did not answer for, with its npm page", () => {
    expect(row("esbuild")).toMatchObject({
      latest: null,
      gap: "current",
      homepage: "https://www.npmjs.com/package/esbuild",
    });
  });
});
