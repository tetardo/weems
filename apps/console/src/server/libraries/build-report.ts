import { heldReason } from "./held.ts";
import type { RegistryInfo } from "./registry.ts";
import { npmPage } from "./registry.ts";
import type { LibraryReport, LibraryRow, SecurityAlert } from "./report.ts";
import { lowestVersion, majorOf, versionGap } from "./version-gap.ts";
import type { DirectLibrary } from "./workspace.ts";

export interface CheckResults {
  libraries: DirectLibrary[];
  /** Same order as `libraries`; null when the registry did not answer for one. */
  registry: (RegistryInfo | null)[];
  alerts: SecurityAlert[];
  packages: number;
  auditError: string | null;
}

function row(library: DirectLibrary, info: RegistryInfo | null, alerts: SecurityAlert[]) {
  const installed = lowestVersion(library.versions);
  const latest = info?.latest ?? null;
  const gap = latest === null ? "current" : versionGap(installed, latest);
  return {
    name: library.name,
    installed,
    versions: library.versions,
    latest,
    gap,
    held: gap === "major" && latest !== null ? heldReason(library.name, majorOf(latest)) : null,
    dev: library.dev,
    users: library.users,
    homepage: info?.homepage ?? npmPage(library.name),
    releasedAt: info?.releasedAt ?? null,
    alerts: alerts.filter((alert) => alert.direct && alert.library === library.name).length,
  } satisfies LibraryRow;
}

/** The page's report from what pnpm and the registry answered. */
export function buildReport(results: CheckResults, now: Date): LibraryReport {
  return {
    checkedAt: now.toISOString(),
    libraries: results.libraries.map((library, index) =>
      row(library, results.registry[index] ?? null, results.alerts),
    ),
    alerts: results.alerts,
    packages: results.packages,
    auditError: results.auditError,
  };
}
