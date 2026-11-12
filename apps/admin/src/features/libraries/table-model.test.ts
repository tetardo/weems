import { describe, expect, it } from "vitest";
import type { LibraryRow, SecurityAlert } from "../../server/libraries/report.ts";
import {
  alertGroups,
  filterOptions,
  filterRows,
  fixedIn,
  gapLabel,
  groupRows,
} from "./table-model.ts";

const lib = (name: string, gap: LibraryRow["gap"], extra: Partial<LibraryRow> = {}) =>
  ({
    name,
    installed: "1.0.0",
    versions: ["1.0.0"],
    latest: "2.0.0",
    gap,
    held: null,
    dev: false,
    users: ["api"],
    homepage: "https://example.org/",
    releasedAt: null,
    alerts: 0,
    ...extra,
  }) satisfies LibraryRow;

const ZOD = lib("zod", "current", { users: ["api", "web"] });
const TYPESCRIPT = lib("typescript", "major", { users: ["racine"] });
const SHARP = lib("sharp", "major", { installed: "0.34.5", alerts: 3 });
const ROWS = [
  ZOD,
  lib("next-intl", "minor", { users: ["web"] }),
  TYPESCRIPT,
  SHARP,
  lib("knip", "patch", { users: ["racine"] }),
];

describe("filters", () => {
  it("counts each filter", () => {
    expect(filterOptions(ROWS).map((option) => option.label)).toEqual([
      "À mettre à jour 4",
      "Majeures 2",
      "Mineures 1",
      "Correctifs 1",
      "Sécurité 1",
      "Toutes 5",
    ]);
  });

  it("puts security first, then the biggest gaps", () => {
    expect(filterRows(ROWS, "updates").map((row) => row.name)).toEqual([
      "sharp",
      "typescript",
      "next-intl",
      "knip",
    ]);
    expect(filterRows(ROWS, "all").at(-1)?.name).toBe("zod");
  });
});

describe("groupRows", () => {
  it("keeps one group without title per library", () => {
    const groups = groupRows(ROWS, ROWS, "library");
    expect(groups).toHaveLength(1);
    expect(groups[0]?.title).toBeNull();
  });

  it("groups by package in the page's order, counting all its libraries", () => {
    const groups = groupRows(ROWS, filterRows(ROWS, "updates"), "user");
    expect(groups.map((group) => group.title)).toEqual(["apps/api", "apps/web", "racine (outils)"]);
    expect(groups[0]?.summary).toBe("2 librairies · 1 à mettre à jour");
    expect(groups[1]?.rows.map((row) => row.name)).toEqual(["next-intl"]);
  });
});

describe("labels", () => {
  it("says when a major step is below 1.0", () => {
    expect(gapLabel(SHARP)).toBe("majeure (0.x)");
    expect(gapLabel(TYPESCRIPT)).toBe("majeure");
    expect(gapLabel(ZOD)).toBe("à jour");
  });
});

const advisory = (library: string, patched: string): SecurityAlert => ({
  library,
  severity: "high",
  title: patched,
  url: "",
  installed: ["0.34.5"],
  patched,
  paths: ["api › sharp"],
  direct: true,
});

describe("security", () => {
  it("makes one card per library and the version that fixes them all", () => {
    const groups = alertGroups([
      advisory("sharp", ">=0.35.0"),
      advisory("sharp", ">=0.35.5"),
      advisory("esbuild", ">=0.25.0"),
    ]);
    expect(groups.map((group) => group.library)).toEqual(["sharp", "esbuild"]);
    expect(fixedIn(groups[0]?.alerts ?? [])).toBe("0.35.5");
  });

  it("keeps npm's wording for a range it cannot simplify", () => {
    expect(fixedIn([advisory("x", "<0.0.0")])).toBe("<0.0.0");
  });
});
