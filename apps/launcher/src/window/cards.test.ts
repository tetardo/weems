import type { LauncherOverview } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { cardsOf } from "./cards.ts";

const now = Date.parse("2026-11-13T10:00:00.000Z");

const overview: LauncherOverview = {
  database: {
    bytes: 1e9,
    largestTable: null,
    migrations: { applied: 14, expected: 14 },
    flights: { real: 42, simulated: 4000 },
    diskBytes: 20e9,
  },
  files: {
    backups: { count: 3, bytes: 300e6, lastAt: "2026-11-13T08:00:00.000Z" },
    disk: { usedBytes: 450e9, totalBytes: 500e9 },
  },
  api: {
    p95Ms: 40,
    serverErrors24h: 0,
    positionsLastMinute: 120,
    live: { flights: 7, simulated: 5 },
    slowP95Ms: 500,
  },
  users: { real: 3, fictitious: 122, newLast7Days: 2, publicProfiles: 2 },
  revenue: {
    fictitious: true,
    totalEuros: 300,
    monthEuros: 75,
    previousMonthEuros: 62.5,
    monthGoalEuros: 100,
  },
};

describe("cardsOf", () => {
  it("puts « Base de données » and « Fichiers » first, as half cards", () => {
    const cards = cardsOf(overview, now);
    expect(cards.map((card) => [card.title, card.half ?? false])).toEqual([
      ["Base de données", true],
      ["Fichiers", true],
      ["API", false],
      ["Utilisateurs actifs", false],
      ["Revenu total", false],
    ]);
  });

  it("fills each circle against its reference", () => {
    const rings = cardsOf(overview, now).map((card) => card.ring);
    expect(rings.map((ring) => ring?.share)).toEqual([0.05, 0.9, 0.08, 0.25, 0.75]);
    expect(rings[1]?.tone).toBe("warn"); // Mac disk 90 % full
    expect(rings[3]?.caption).toBe("objectif 500");
  });

  it("says when the last backup was made, or that there is none", () => {
    expect(cardsOf(overview, now)[1]?.lines[1]?.text).toBe("Dernière : il y a 2 h 00");
    const none = { ...overview.files, backups: { count: 0, bytes: 0, lastAt: null } };
    expect(cardsOf({ ...overview, files: none }, now)[1]?.lines[1]).toEqual({
      text: "Aucune sauvegarde",
      tone: "warn",
    });
  });

  it("shows five empty cards when the console does not answer", () => {
    expect(cardsOf(null, now)).toHaveLength(5);
  });
});
