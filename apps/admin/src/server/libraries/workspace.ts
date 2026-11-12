import { basename, relative } from "node:path";
import { z } from "zod";

const entries = z.record(z.string(), z.object({ version: z.string() })).optional();
const pnpmListSchema = z.array(
  z.object({ path: z.string(), dependencies: entries, devDependencies: entries }),
);

/** A direct library of the repository, as `pnpm ls -r --depth 0 --json` reports it. */
export interface DirectLibrary {
  name: string;
  /** Installed versions, one per distinct version (several when packages disagree). */
  versions: string[];
  dev: boolean;
  users: string[];
}

/** "apps/api" → "api", the root → "racine". */
function userName(repoRoot: string, path: string): string {
  return relative(repoRoot, path) === "" ? "racine" : basename(path);
}

/** Workspace links (`link:../../packages/ui`) are our own packages, not libraries. */
const isLibrary = (version: string) => /^\d/.test(version);

interface Use {
  user: string;
  dev: boolean;
}

function add(found: Map<string, DirectLibrary>, name: string, version: string, use: Use) {
  const library = found.get(name) ?? { name, versions: [], dev: true, users: [] };
  if (!library.versions.includes(version)) library.versions.push(version);
  if (!library.users.includes(use.user)) library.users.push(use.user);
  library.dev &&= use.dev;
  found.set(name, library);
}

function addAll(
  found: Map<string, DirectLibrary>,
  deps: Record<string, { version: string }>,
  use: Use,
) {
  for (const [name, { version }] of Object.entries(deps))
    if (isLibrary(version)) add(found, name, version, use);
}

/** Every library the packages of the repository depend on directly, sorted by name. */
export function parsePnpmList(output: string, repoRoot: string): DirectLibrary[] {
  const found = new Map<string, DirectLibrary>();
  for (const pkg of pnpmListSchema.parse(JSON.parse(output))) {
    const user = userName(repoRoot, pkg.path);
    const groups = [
      { deps: pkg.dependencies ?? {}, dev: false },
      { deps: pkg.devDependencies ?? {}, dev: true },
    ];
    for (const { deps, dev } of groups) addAll(found, deps, { user, dev });
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Number of packages of the repository in the same output. */
export const packageCount = (output: string) => pnpmListSchema.parse(JSON.parse(output)).length;
