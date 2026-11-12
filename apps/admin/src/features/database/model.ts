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

export const MIGRATION_LABELS: Record<MigrationState, string> = {
  applied: "appliquée",
  pending: "en attente",
  skipped: "sautée",
  changed: "modifiée",
  duplicate: "en double",
  unknown: "inconnue du dépôt",
};

/** Tone of a state: ok (green), warn (orange: one command fixes it), bad (red: by hand). */
export function migrationTone(state: MigrationState): "ok" | "warn" | "bad" {
  if (state === "applied") return "ok";
  return state === "pending" ? "warn" : "bad";
}

/** « 10 / 10 » applied out of the code's migrations, and what to say under it. */
export function migrationSummary(migrations: AdminDatabase["migrations"]) {
  const inCode = migrations.filter((m) => m.tag !== null && m.state !== "duplicate").length;
  const applied = migrations.filter((m) => m.state === "applied").length;
  const pending = migrations.filter((m) => m.state === "pending").length;
  const problems = migrations.filter((m) => migrationTone(m.state) === "bad").length;
  const tone = problems ? "bad" : pending ? "warn" : "ok";
  const status = problems
    ? `${plural(problems, "anomalie")} à corriger à la main`
    : pending
      ? `${plural(pending, "migration")} en attente`
      : "à jour";
  return { applied, inCode, pending, tone, status } as const;
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
