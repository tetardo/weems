import type {
  LibraryReport,
  LibraryRow,
  SecurityAlert,
  Severity,
  VersionGap,
} from "../../server/libraries/report.ts";
import { compareVersions, isZeroMajor } from "../../server/libraries/version-gap.ts";

export type FilterId = "updates" | "major" | "minor" | "patch" | "security" | "all";
export type Grouping = "library" | "user";

const FILTERS: readonly { id: FilterId; label: string; keep: (row: LibraryRow) => boolean }[] = [
  { id: "updates", label: "À mettre à jour", keep: (row) => row.gap !== "current" },
  { id: "major", label: "Majeures", keep: (row) => row.gap === "major" },
  { id: "minor", label: "Mineures", keep: (row) => row.gap === "minor" },
  { id: "patch", label: "Correctifs", keep: (row) => row.gap === "patch" },
  { id: "security", label: "Sécurité", keep: (row) => row.alerts > 0 },
  { id: "all", label: "Toutes", keep: () => true },
];

/** The filter bar, each label with its count: « Majeures 4 ». */
export function filterOptions(rows: readonly LibraryRow[]) {
  return FILTERS.map(({ id, label, keep }) => ({
    value: id,
    label: `${label} ${rows.filter(keep).length}`,
  }));
}

const GAP_ORDER: Record<VersionGap, number> = { major: 0, minor: 1, patch: 2, current: 3 };

/** Rows of a filter, the most urgent first: security, then the size of the gap, then the name. */
export function filterRows(rows: readonly LibraryRow[], filter: FilterId): LibraryRow[] {
  const keep = FILTERS.find((candidate) => candidate.id === filter)?.keep ?? (() => true);
  return rows
    .filter(keep)
    .sort(
      (a, b) =>
        Number(b.alerts > 0) - Number(a.alerts > 0) ||
        GAP_ORDER[a.gap] - GAP_ORDER[b.gap] ||
        a.name.localeCompare(b.name),
    );
}

/** Packages of the repository in the order of the page, then any other. */
const USER_ORDER = ["api", "web", "admin", "tracker", "ui", "contrats", "e2e", "racine"];
const USER_TITLES: Record<string, string> = {
  api: "apps/api",
  web: "apps/web",
  admin: "apps/admin",
  tracker: "apps/tracker",
  ui: "packages/ui",
  contrats: "packages/contrats",
  racine: "racine (outils)",
};

export interface RowGroup {
  key: string;
  /** Null for the single group of the « par librairie » view. */
  title: string | null;
  summary: string;
  rows: LibraryRow[];
}

const rank = (user: string) => {
  const index = USER_ORDER.indexOf(user);
  return index === -1 ? USER_ORDER.length : index;
};

/** « Par application »: one group per package, with all its libraries counted in the summary. */
export function groupRows(
  all: readonly LibraryRow[],
  shown: LibraryRow[],
  grouping: Grouping,
): RowGroup[] {
  if (grouping === "library") return [{ key: "all", title: null, summary: "", rows: shown }];
  const users = [...new Set(all.flatMap((row) => row.users))].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  );
  return users
    .map((user) => {
      const own = all.filter((row) => row.users.includes(user));
      const late = own.filter((row) => row.gap !== "current").length;
      return {
        key: user,
        title: USER_TITLES[user] ?? user,
        summary: `${own.length} librairies · ${late ? `${late} à mettre à jour` : "tout est à jour"}`,
        rows: shown.filter((row) => row.users.includes(user)),
      };
    })
    .filter((group) => group.rows.length > 0);
}

/** « majeure (0.x) » below 1.0, where a minor step may break. */
export function gapLabel(row: LibraryRow): string {
  if (row.gap === "major") return isZeroMajor(row.installed) ? "majeure (0.x)" : "majeure";
  return { minor: "mineure", patch: "correctif", current: "à jour" }[row.gap];
}

/** Figures of the four tiles. */
export function summaryOf(report: LibraryReport) {
  const count = (gap: VersionGap) => report.libraries.filter((row) => row.gap === gap).length;
  const bySeverity = (severity: Severity) =>
    report.alerts.filter((alert) => alert.severity === severity).length;
  return {
    libraries: report.libraries.length,
    current: count("current"),
    major: count("major"),
    minor: count("minor"),
    patch: count("patch"),
    alerts: report.alerts.length,
    critical: bySeverity("critical"),
    high: bySeverity("high"),
    moderate: bySeverity("moderate") + bySeverity("low") + bySeverity("info"),
  };
}

export interface AlertGroup {
  library: string;
  /** Worst severity of its advisories (they come sorted, worst first). */
  severity: Severity;
  alerts: SecurityAlert[];
  direct: boolean;
}

/** One card per vulnerable library, in the order of the advisories (worst first). */
export function alertGroups(alerts: readonly SecurityAlert[]): AlertGroup[] {
  const groups = new Map<string, AlertGroup>();
  for (const alert of alerts) {
    const group = groups.get(alert.library);
    if (group) group.alerts.push(alert);
    else
      groups.set(alert.library, {
        library: alert.library,
        severity: alert.severity,
        alerts: [alert],
        direct: alert.direct,
      });
  }
  return [...groups.values()];
}

/**
 * The version that fixes every advisory of a library: « 0.35.5 » for « >=0.35.0 » and
 * « >=0.35.5 »; npm's own wording when one is not of that simple form.
 */
export function fixedIn(alerts: readonly SecurityAlert[]): string {
  const ranges = [...new Set(alerts.map((alert) => alert.patched))];
  const versions = ranges.map((range) => /^>=\s*(\d+\.\d+\.\d+)$/.exec(range)?.[1]);
  if (versions.some((version) => version === undefined)) return ranges.join(", ");
  return (versions as string[]).sort(compareVersions).at(-1) ?? "";
}
