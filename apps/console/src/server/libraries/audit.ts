import { z } from "zod";
import { type SecurityAlert, severitySchema } from "./report.ts";
import { webUrl } from "./web-url.ts";

const auditSchema = z.object({
  advisories: z.record(
    z.string(),
    z.object({
      module_name: z.string(),
      severity: severitySchema,
      title: z.string(),
      url: z.string(),
      patched_versions: z.string(),
      findings: z.array(z.object({ version: z.string(), paths: z.array(z.string()) })),
    }),
  ),
});

const SHOWN_PATHS = 3;
const RANK = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 } as const;

/** "apps__api>drizzle-kit>esbuild" → ["api", "drizzle-kit", "esbuild"]; "." is the root. */
function segments(path: string): string[] {
  const [owner = ".", ...rest] = path.split(">");
  return [owner === "." ? "racine" : (owner.split("__").pop() ?? owner), ...rest];
}

/**
 * The advisories of `pnpm audit --json`, worst first. Direct when the vulnerable library is
 * itself in a package.json of the repository (path of two steps: package › library).
 */
export function parseAudit(output: string): SecurityAlert[] {
  const { advisories } = auditSchema.parse(JSON.parse(output));
  return Object.values(advisories)
    .map((advisory) => {
      const paths = advisory.findings.flatMap((finding) => finding.paths).map(segments);
      return {
        library: advisory.module_name,
        severity: advisory.severity,
        title: advisory.title,
        url: webUrl(advisory.url) ?? "",
        installed: [...new Set(advisory.findings.map((finding) => finding.version))],
        patched: advisory.patched_versions,
        paths: [...new Set(paths.map((steps) => steps.join(" › ")))].slice(0, SHOWN_PATHS),
        direct: paths.some((steps) => steps.length === 2),
      };
    })
    .sort((a, b) => RANK[a.severity] - RANK[b.severity] || a.library.localeCompare(b.library));
}
