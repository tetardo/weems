import { describe, expect, it } from "vitest";
import {
  apiSummary,
  barHeights,
  eventText,
  hours,
  migrationsText,
  newestVersion,
  shares,
  weekDelta,
} from "./figures.ts";

describe("figures of the page Supervision", () => {
  it("writes hours and weekly changes in French", () => {
    expect(hours(1.46)).toBe("1,5 h");
    expect(hours(22.4)).toBe("22 h");
    expect(weekDelta(3)).toBe("+3 sur 7 j");
    expect(weekDelta(0)).toBe("= sur 7 j");
  });

  it("scales bars to the tallest, keeps small ones visible and zeros empty", () => {
    expect(barHeights([0, 1, 100])).toEqual([0, 4, 100]);
    expect(barHeights([0, 0])).toEqual([0, 0]);
  });

  it("gives whole percentages", () => {
    expect(shares([72, 21, 7])).toEqual([72, 21, 7]);
    expect(shares([])).toEqual([]);
    expect(shares([0])).toEqual([0]);
  });

  it("finds the newest tracker version in numeric order", () => {
    expect(newestVersion(["0.9.0", "0.10.0", "0.1.2"])).toBe("0.10.0");
    expect(newestVersion([])).toBeNull();
  });

  it("sums the server errors and finds the worst hour", () => {
    const summary = apiSummary([
      { p95Ms: null, serverErrors: 0 },
      { p95Ms: 120, serverErrors: 2 },
      { p95Ms: 40, serverErrors: 1 },
    ]);
    expect(summary).toEqual({ lastP95Ms: 40, worstP95Ms: 120, serverErrors: 3 });
  });

  it("tells the events in one line, without the invitation's e-mail", () => {
    const at = "2026-11-12T05:00:00.000Z";
    expect(
      eventText({
        at,
        kind: "flightOpened",
        pilot: "Léa",
        flight: { callsign: "AFR42K", from: "LFPG", to: null },
      }),
    ).toBe("Vol ouvert · AFR42K · LFPG → ? · Léa");
    expect(eventText({ at, kind: "invitationCreated", pilot: null, flight: null })).toBe(
      "Invitation créée",
    );
    expect(eventText({ at, kind: "profilePublished", pilot: "Léa", flight: null })).toBe(
      "Profil publié · Léa",
    );
  });

  it("says when migrations are missing", () => {
    expect(migrationsText({ applied: 10, expected: 10 })).toBe("Migrations à jour");
    expect(migrationsText({ applied: 8, expected: 10 })).toBe("2 migrations en retard");
  });
});
