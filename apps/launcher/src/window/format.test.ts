import { describe, expect, it } from "vitest";
import { lineKind, plainText, sinceText, trendOf } from "./format.ts";

describe("sinceText", () => {
  const now = Date.parse("2026-11-13T08:00:00.000Z");
  it("writes seconds, minutes, then hours", () => {
    expect(sinceText("2026-11-13T07:59:56.000Z", now)).toBe("4 s");
    expect(sinceText("2026-11-13T07:40:00.000Z", now)).toBe("20 min");
    expect(sinceText("2026-11-13T05:55:00.000Z", now)).toBe("2 h 05");
    expect(sinceText(null, now)).toBeNull();
  });
});

describe("log lines", () => {
  it("removes terminal colours", () => {
    expect(plainText("\u001b[1m›\u001b[0m Démarrage de la base")).toBe("› Démarrage de la base");
  });

  it("colours errors, warnings, steps and successes", () => {
    expect(lineKind("05:41:17 ERROR connection terminated")).toBe("error");
    expect(lineKind("✗ Port 3000 pris par « java »")).toBe("error");
    expect(lineKind("05:40:12 WARN slow query")).toBe("warn");
    expect(lineKind("› Démarrage de la base")).toBe("step");
    expect(lineKind(" ✓ Ready in 1.8s")).toBe("ok");
    expect(lineKind("GET /fr 200 in 912ms")).toBeNull();
  });
});

describe("trendOf", () => {
  it("shows the change from last month with an arrow", () => {
    expect(trendOf(60, 50)).toEqual({ text: "▲ +20 %", up: true });
    expect(trendOf(46, 50)).toEqual({ text: "▼ −8 %", up: false });
    expect(trendOf(10, 0)).toEqual({ text: "▲", up: true });
  });
});
