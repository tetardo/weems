import { describe, expect, it } from "vitest";
import { packageCount, parsePnpmList } from "./workspace.ts";

const ROOT = "/repo";
const dep = (version: string) => ({ from: "x", version });
const OUTPUT = JSON.stringify([
  { name: "weems", path: ROOT, devDependencies: { typescript: dep("6.0.3") } },
  {
    name: "@weems/api",
    path: `${ROOT}/apps/api`,
    dependencies: {
      zod: dep("4.6.7"),
      sharp: dep("0.34.5"),
      "@weems/contrats": dep("link:../../packages/contrats"),
    },
    devDependencies: { "drizzle-kit": dep("0.31.11") },
  },
  {
    name: "@weems/web",
    path: `${ROOT}/apps/web`,
    dependencies: { zod: dep("4.6.8") },
    devDependencies: { typescript: dep("6.0.3") },
  },
]);

describe("parsePnpmList", () => {
  const libraries = parsePnpmList(OUTPUT, ROOT);
  const byName = (name: string) => libraries.find((library) => library.name === name);

  it("lists each library once, sorted, without our own packages", () => {
    expect(libraries.map((library) => library.name)).toEqual([
      "drizzle-kit",
      "sharp",
      "typescript",
      "zod",
    ]);
  });

  it("names the packages that use it, the root as « racine »", () => {
    expect(byName("typescript")?.users).toEqual(["racine", "web"]);
    expect(byName("sharp")?.users).toEqual(["api"]);
  });

  it("keeps every installed version when packages disagree", () => {
    expect(byName("zod")?.versions).toEqual(["4.6.7", "4.6.8"]);
  });

  it("is dev only when no package needs it at run time", () => {
    expect(byName("drizzle-kit")?.dev).toBe(true);
    expect(byName("zod")?.dev).toBe(false);
  });

  it("counts the packages of the repository", () => {
    expect(packageCount(OUTPUT)).toBe(3);
  });
});
