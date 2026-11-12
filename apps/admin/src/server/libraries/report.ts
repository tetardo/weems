import { z } from "zod";

/** How far the installed version is behind the latest one published on npm. */
const versionGapSchema = z.enum(["major", "minor", "patch", "current"]);
export type VersionGap = z.infer<typeof versionGapSchema>;

export const severitySchema = z.enum(["critical", "high", "moderate", "low", "info"]);
export type Severity = z.infer<typeof severitySchema>;

/** One library the repository depends on directly (page Librairies, spec admin). */
const libraryRowSchema = z.object({
  name: z.string(),
  /** Lowest installed version; `versions` lists them all when packages disagree. */
  installed: z.string(),
  versions: z.array(z.string()),
  /** Null when the registry did not answer for this library. */
  latest: z.string().nullable(),
  gap: versionGapSchema,
  /** Why the update is held back on purpose (held.ts), null otherwise. */
  held: z.string().nullable(),
  /** Only in devDependencies, wherever it is used. */
  dev: z.boolean(),
  /** Packages of the repository that use it: "api", "web", "racine"… */
  users: z.array(z.string()),
  /** Official page declared by the library on npm (http or https only). */
  homepage: z.string(),
  /** Publication of the latest version, ISO date; null when npm does not say. */
  releasedAt: z.string().nullable(),
  /** Security alerts on this library itself (not on what it pulls in). */
  alerts: z.number().int(),
});
export type LibraryRow = z.infer<typeof libraryRowSchema>;

/** One advisory of `pnpm audit`, on a direct library or on one pulled in by another. */
const securityAlertSchema = z.object({
  library: z.string(),
  severity: severitySchema,
  title: z.string(),
  /** Page of the advisory, empty when npm gave no web address. */
  url: z.string(),
  /** Vulnerable versions found in the lockfile. */
  installed: z.array(z.string()),
  /** Versions that fix it, as npm writes them (">=0.35.5"). */
  patched: z.string(),
  /** At most three dependency chains, "api › drizzle-kit › esbuild". */
  paths: z.array(z.string()),
  /** The vulnerable library is a direct dependency of a package of the repository. */
  direct: z.boolean(),
});
export type SecurityAlert = z.infer<typeof securityAlertSchema>;

export const libraryReportSchema = z.object({
  checkedAt: z.string(),
  libraries: z.array(libraryRowSchema),
  alerts: z.array(securityAlertSchema),
  /** Packages of the repository read by pnpm ls. */
  packages: z.number().int(),
  /** The audit could not run (no network…): the page says so instead of « 0 alerte ». */
  auditError: z.string().nullable(),
});
export type LibraryReport = z.infer<typeof libraryReportSchema>;

/** What the page reads every few seconds. */
export interface LibrariesView {
  report: LibraryReport | null;
  checking: boolean;
  error: string | null;
}
