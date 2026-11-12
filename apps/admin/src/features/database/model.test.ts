import type { AdminDatabase } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import {
  backupWarning,
  cleanupLines,
  cleanupResultText,
  growthText,
  migrationLabel,
  migrationSummary,
  migrationTone,
  simulatedShare,
  sizeDetail,
} from "./model.ts";

const migration = (
  tag: string | null,
  state: AdminDatabase["migrations"][number]["state"],
  createdAt = "2026-11-12T03:58:00.000Z",
) => ({ tag, createdAt, state });

describe("figures of the page Base de données", () => {
  it("sums up the migrations: up to date, pending, or a problem to fix by hand", () => {
    expect(migrationSummary([migration("a", "applied"), migration("b", "applied")])).toMatchObject({
      applied: 2,
      inCode: 2,
      tone: "ok",
      status: "à jour",
      detail: "appliquées sur celles du code",
    });
    const pending = migrationSummary([migration("a", "applied"), migration("b", "pending")]);
    expect(pending).toMatchObject({
      applied: 1,
      inCode: 2,
      tone: "warn",
      status: "1 migration en attente",
    });
    const broken = migrationSummary([
      migration("a", "applied"),
      migration("b", "skipped"),
      migration(null, "unknown", "2026-11-13T00:00:00.000Z"),
    ]);
    expect(broken).toMatchObject({ tone: "bad", status: "2 anomalies à corriger à la main" });
  });

  it("says that an extra row older than the newest migration changes nothing", () => {
    // The case of the Mac on 12/11: 0007 recorded a second time, before 0008 and 0009.
    const migrations = [
      migration("0009", "applied", "2026-11-12T03:58:00.000Z"),
      migration("0007", "applied", "2026-11-11T22:15:00.000Z"),
      migration("0007", "duplicate", "2026-11-11T22:20:00.000Z"),
    ];
    expect(migrationSummary(migrations)).toMatchObject({
      applied: 2,
      inCode: 2,
      harmless: 1,
      tone: "ok",
      status: "à jour",
      detail: "appliquées · 1 ligne en trop en base, sans effet",
    });
    const [, , extra] = migrations;
    expect(extra && migrationTone(extra, migrations)).toBe("warn");
    expect(extra && migrationLabel(extra, migrations)).toBe("en double, sans effet");
    // Newer than every migration of the code, it would make Drizzle skip the next ones.
    const blocking = migration(null, "unknown", "2026-11-14T00:00:00.000Z");
    expect(migrationTone(blocking, [...migrations, blocking])).toBe("bad");
  });

  it("weights the simulated share by the size of the flight tables", () => {
    const table = (name: string, totalBytes: number, share: number | null) => ({
      name,
      rowsEstimate: 1,
      dataBytes: totalBytes,
      indexBytes: 0,
      totalBytes,
      simulatedShare: share,
    });
    const tables = [
      table("flight_tracks", 900, 1),
      table("flights", 100, 0),
      table("users", 5000, null),
    ];
    expect(simulatedShare(tables)).toBeCloseTo(0.9);
    expect(simulatedShare([])).toBe(0);
    expect(sizeDetail(tables, 10_000)).toBe("3 tables · 9 % dans flight_tracks");
    expect(sizeDetail([], 0)).toBe("0 table");
  });

  it("writes growth and warns when the newest backup is missing or older than 7 days", () => {
    expect(growthText(36_000_000)).toBe("+36 Mo");
    expect(growthText(-2_000_000)).toBe("−2 Mo");
    expect(growthText(200)).toBe("=");
    const now = Date.parse("2026-11-12T12:00:00.000Z");
    expect(backupWarning(null, now)).toBe("Aucune sauvegarde.");
    expect(backupWarning("2026-11-11T12:00:00.000Z", now)).toBeNull();
    expect(backupWarning("2026-11-03T12:00:00.000Z", now)).toBe(
      "Dernière sauvegarde il y a 9 jours.",
    );
  });

  it("says what the cleanup will delete, then what it deleted", () => {
    const preview = {
      olderThanDays: 7,
      simulatedFlights: { count: 48, bytes: 212_000_000 },
      expiredSessions: 37,
      expiredInvitations: 1,
    };
    expect(
      cleanupLines(preview, {
        simulatedFlights: true,
        expiredSessions: false,
        expiredInvitations: true,
      }),
    ).toEqual(["48 vols simulés de plus de 7 jours (environ 212 Mo)", "1 invitation expirée"]);
    expect(
      cleanupResultText({ simulatedFlights: 48, expiredSessions: 37, expiredInvitations: 0 }),
    ).toBe("Supprimé : 48 vols simulés, 37 sessions.");
    expect(
      cleanupResultText({ simulatedFlights: 0, expiredSessions: 0, expiredInvitations: 0 }),
    ).toBe("Rien à supprimer.");
  });
});
