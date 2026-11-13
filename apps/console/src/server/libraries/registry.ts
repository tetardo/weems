import { z } from "zod";
import { webUrl } from "./web-url.ts";

const REGISTRY = "https://registry.npmjs.org";
const TIMEOUT_MS = 30_000;

/** What npm says of a library: its latest version, its official page, when it came out. */
export interface RegistryInfo {
  latest: string;
  homepage: string;
  releasedAt: string | null;
}

/** The parts of the package document of the registry the page needs. */
const packageSchema = z.object({
  "dist-tags": z.object({ latest: z.string() }),
  time: z.record(z.string(), z.string()).optional(),
  homepage: z.unknown().optional(),
});

/** The npm page of the library, always there. */
export const npmPage = (name: string) => `https://www.npmjs.com/package/${name}`;

/** The homepage a library declares when it is a web address, else its npm page. */
export const officialPage = (name: string, homepage: unknown) => webUrl(homepage) ?? npmPage(name);

/** Latest version, official page and date of that version, from a package document. */
export function readPackage(name: string, document: unknown): RegistryInfo {
  const pkg = packageSchema.parse(document);
  const latest = pkg["dist-tags"].latest;
  return {
    latest,
    homepage: officialPage(name, pkg.homepage),
    releasedAt: pkg.time?.[latest] ?? null,
  };
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

/**
 * The whole package document: the only reliable source of release dates (the search index
 * refuses bursts). It weighs up to 2.5 MB compressed for Next.js, fetched on demand only.
 */
export async function registryInfo(name: string): Promise<RegistryInfo> {
  return readPackage(name, await getJson(`${REGISTRY}/${name.replace("/", "%2F")}`));
}

/** Runs `task` on every item, at most `limit` at a time; a failure gives null for that item. */
export async function mapLimited<T, R>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<(R | null)[]> {
  const results: (R | null)[] = new Array(items.length).fill(null);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index] as T).catch(() => null);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
