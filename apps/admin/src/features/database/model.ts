import type {
  AdminDatabase,
  DatabaseCleanupRequest,
  DatabaseCleanupResult,
  MigrationState,
} from "@weems/contrats";
import { bytes } from "../../format/bytes.ts";

/** Figures and sentences of the page Base de données, in French. Pure: tested apart. */

const fr = (n: number) => n.toLocaleString("fr-FR");
const plural = (n: number, one: string, many = `${one}s`) => `${fr(n)} ${n > 1 ? many : one}`;

const MIGRATION_LABELS: Record<MigrationState, string> = {
  applied: "appliquée",
  pending: "en attente",
  skipped: "sautée",
  changed: "modifiée",
  duplicate: "en double",
  unknown: "inconnue du dépôt",
};

type Migration = AdminDatabase["migrations"][number];
type Tone = "ok" | "warn" | "bad";

const IN_CODE: readonly MigrationState[] = ["applied", "pending", "skipped", "changed"];
const isExtraRow = (m: Migration) => m.state === "duplicate" || m.state === "unknown";

/** Date of the newest migration of the code: Drizzle applies only what is newer than its last row. */
function newestInCode(migrations: readonly Migration[]): number {
  const dates = migrations
    .filter((m) => IN_CODE.includes(m.state))
    .map((m) => Date.parse(m.createdAt));
  return Math.max(-Infinity, ...dates);
}

/**
 * An extra row of drizzle.__drizzle_migrations (in double, or unknown) dated before the newest
 * migration of the code changes nothing: Drizzle only looks at its newest row. Newer, it would
 * make Drizzle skip the migrations dated before it.
 */
function isHarmless(m: Migration, newestMs: number): boolean {
  return isExtraRow(m) && Date.parse(m.createdAt) <= newestMs;
}

/** Tone of a migration: ok (green), warn (orange: one command fixes it, or no effect), bad (red: by hand). */
export function migrationTone(m: Migration, migrations: readonly Migration[]): Tone {
  if (m.state === "applied") return "ok";
  if (m.state === "pending" || isHarmless(m, newestInCode(migrations))) return "warn";
  return "bad";
}

/** Label of a migration; an extra row without effect says so. */
export function migrationLabel(m: Migration, migrations: readonly Migration[]): string {
  const label = MIGRATION_LABELS[m.state];
  return isHarmless(m, newestInCode(migrations)) ? `${label}, sans effet` : label;
}

/** « 10 / 10 » applied out of the code's migrations, and what to say about it. */
export function migrationSummary(migrations: readonly Migration[]) {
  const newestMs = newestInCode(migrations);
  const inCode = migrations.filter((m) => m.tag !== null && m.state !== "duplicate").length;
  const applied = migrations.filter((m) => m.state === "applied").length;
  const pending = migrations.filter((m) => m.state === "pending").length;
  const harmless = migrations.filter((m) => isHarmless(m, newestMs)).length;
  const problems = migrations.filter((m) => migrationTone(m, migrations) === "bad").length;
  const tone: Tone = problems ? "bad" : pending ? "warn" : "ok";
  const status = problems
    ? `${plural(problems, "anomalie")} à corriger à la main`
    : pending
      ? `${plural(pending, "migration")} en attente`
      : "à jour";
  const detail = harmless
    ? `appliquées · ${plural(harmless, "ligne")} en trop en base, sans effet`
    : "appliquées sur celles du code";
  return { applied, inCode, pending, harmless, tone, status, detail } as const;
}

/** Share of the flight tables that is simulated, weighted by size. */
export function simulatedShare(tables: AdminDatabase["tables"]): number {
  let simulated = 0;
  let total = 0;
  for (const table of tables) {
    if (table.simulatedShare === null) continue;
    simulated += table.totalBytes * table.simulatedShare;
    total += table.totalBytes;
  }
  return total === 0 ? 0 : simulated / total;
}

/** « 17 tables · 96 % dans flight_tracks ». */
export function sizeDetail(tables: AdminDatabase["tables"], totalBytes: number): string {
  const [largest] = tables;
  const count = plural(tables.length, "table");
  if (!largest || totalBytes === 0) return count;
  return `${count} · ${Math.round((largest.totalBytes / totalBytes) * 100)} % dans ${largest.name}`;
}

/** « +36 Mo », « −2 Mo », « = » for a growth in bytes. */
export function growthText(value: number): string {
  if (Math.abs(value) < 1_000) return "=";
  return `${value > 0 ? "+" : "−"}${bytes(Math.abs(value))}`;
}

/** Whole days between a backup and now. */
const daysSince = (iso: string, nowMs: number) =>
  Math.floor((nowMs - Date.parse(iso)) / 86_400_000);

/** No backup, or the newest one older than 7 days: the page warns. */
export function backupWarning(newest: string | null, nowMs: number): string | null {
  if (!newest) return "Aucune sauvegarde.";
  const days = daysSince(newest, nowMs);
  return days >= 7 ? `Dernière sauvegarde il y a ${days} jours.` : null;
}

export type CleanupChoice = keyof DatabaseCleanupRequest;

/** One line per choice, for the confirmation and the result. */
export function cleanupLines(
  preview: AdminDatabase["cleanup"],
  choice: DatabaseCleanupRequest,
): string[] {
  const lines: string[] = [];
  if (choice.simulatedFlights)
    lines.push(
      `${plural(preview.simulatedFlights.count, "vol simulé", "vols simulés")} de plus de ${preview.olderThanDays} jours (environ ${bytes(preview.simulatedFlights.bytes)})`,
    );
  if (choice.expiredSessions)
    lines.push(plural(preview.expiredSessions, "session expirée", "sessions expirées"));
  if (choice.expiredInvitations)
    lines.push(plural(preview.expiredInvitations, "invitation expirée", "invitations expirées"));
  return lines;
}

/** « Supprimé : 48 vols simulés, 37 sessions. » */
export function cleanupResultText(result: DatabaseCleanupResult): string {
  const parts = [
    result.simulatedFlights && plural(result.simulatedFlights, "vol simulé", "vols simulés"),
    result.expiredSessions && plural(result.expiredSessions, "session", "sessions"),
    result.expiredInvitations && plural(result.expiredInvitations, "invitation"),
  ].filter(Boolean);
  return parts.length ? `Supprimé : ${parts.join(", ")}.` : "Rien à supprimer.";
}
