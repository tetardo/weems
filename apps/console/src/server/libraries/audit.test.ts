import { describe, expect, it } from "vitest";
import { parseAudit } from "./audit.ts";

const advisory = (
  module_name: string,
  severity: string,
  paths: string[],
  extra: Record<string, unknown> = {},
) => ({
  module_name,
  severity,
  title: `${module_name} issue`,
  url: `https://github.com/advisories/${module_name}`,
  patched_versions: ">=1.0.0",
  findings: [{ version: "0.9.0", paths }],
  ...extra,
});

const OUTPUT = JSON.stringify({
  actions: [],
  advisories: {
    "1": advisory("esbuild", "moderate", ["apps__api>drizzle-kit>esbuild"]),
    "2": advisory("sharp", "high", ["apps__api>sharp"]),
    "3": advisory("minimatch", "moderate", [".>eslint>minimatch"], { url: "javascript:alert(1)" }),
  },
  metadata: {},
});

describe("parseAudit", () => {
  const alerts = parseAudit(OUTPUT);

  it("puts the worst first, then by name", () => {
    expect(alerts.map((alert) => alert.library)).toEqual(["sharp", "esbuild", "minimatch"]);
  });

  it("tells a direct library from one pulled in by another", () => {
    expect(alerts[0]?.direct).toBe(true);
    expect(alerts[1]?.direct).toBe(false);
  });

  it("writes the chains with the package names, the root as « racine »", () => {
    expect(alerts[1]?.paths).toEqual(["api › drizzle-kit › esbuild"]);
    expect(alerts[2]?.paths).toEqual(["racine › eslint › minimatch"]);
  });

  it("drops an advisory address that is not a web page", () => {
    expect(alerts[0]?.url).toBe("https://github.com/advisories/sharp");
    expect(alerts[2]?.url).toBe("");
  });

  it("reads an audit with nothing to report", () => {
    expect(parseAudit(JSON.stringify({ advisories: {} }))).toEqual([]);
  });
});
