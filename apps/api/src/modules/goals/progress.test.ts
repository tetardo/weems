import type { GoalDefinition } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import type { FlightFact } from "./facts.ts";
import { goalView } from "./goal-view.ts";
import { progressOf } from "./progress.ts";
import { goalSuggestions } from "./suggestions.ts";
import { currentWindow, previousWindows } from "./windows.ts";

const day = (d: number, h = 8) => Date.UTC(2026, 10, d, h);
const practices = { noAlert: true, speed250: true, sinkRate: true, bank30: null };

function fact(d: number, more: Partial<FlightFact> = {}): FlightFact {
  return {
    flightId: `f${d}`,
    at: day(d),
    departureIcao: "LFPG",
    arrivalIcao: "LFMN",
    hours: 1.5,
    touchdownVs: -120,
    clean: true,
    category: "narrowBody",
    model: "A20N",
    practices,
    ...more,
  };
}

const goal = (definition: Partial<GoalDefinition>): GoalDefinition => ({
  kind: "hours",
  target: 20,
  threshold: null,
  practice: null,
  aircraft: null,
  window: "month",
  until: null,
  recurring: false,
  ...definition,
});

describe("goal windows", () => {
  it("counts the whole month or week of the creation, and the current one when it repeats", () => {
    const created = new Date(day(12));
    expect(currentWindow(goal({}), created, new Date(day(20))).from.toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
    const week = currentWindow(goal({ window: "week" }), created, created);
    expect(week.from.toISOString()).toBe("2026-11-09T00:00:00.000Z"); // Monday
    const repeated = goal({ recurring: true });
    const january = new Date(Date.UTC(2027, 0, 5));
    expect(currentWindow(repeated, created, january).from.toISOString()).toBe(
      "2027-01-01T00:00:00.000Z",
    );
    expect(previousWindows(repeated, created, january, 6)).toHaveLength(2);
  });
});

describe("goal progress", () => {
  const month = { from: new Date(day(1, 0)), to: new Date(Date.UTC(2026, 11, 1)) };

  it("adds hours, soft touchdowns and new airports", () => {
    const facts = [fact(2), fact(3, { touchdownVs: -300 }), fact(4, { arrivalIcao: "LFBO" })];
    expect(progressOf(goal({}), facts, month).value).toBe(4.5);
    const soft = goal({ kind: "softLandings", target: 5, threshold: 150 });
    expect(progressOf(soft, facts, month).value).toBe(2);
    const airports = progressOf(goal({ kind: "airports", target: 3 }), facts, month);
    expect(airports.value).toBe(3); // LFPG, LFMN, then LFBO
  });

  it("restarts a streak after a flight that is not clean, and keeps the record", () => {
    const facts = [fact(2), fact(3), fact(4, { clean: false }), fact(5)];
    const streak = progressOf(goal({ kind: "cleanStreak", target: 10, window: "none" }), facts, {
      from: month.from,
      to: null,
    });
    expect(streak).toMatchObject({ value: 1, record: 2, reachedAt: null });
  });

  it("is ahead when above the steady pace, and projects the day it is reached", () => {
    const record = {
      goalId: "g",
      definition: goal({}),
      createdAt: new Date(day(1)),
      archivedAt: null,
    };
    const facts = Array.from({ length: 8 }, (_, i) => fact(i + 2)); // 12 h by the 9th
    const view = goalView(record, facts, new Date(day(10)));
    expect(view).toMatchObject({ status: "active", value: 12, pace: "ahead", flights: 8 });
    expect(view.recentFlights).toHaveLength(5);
    expect(Date.parse(view.projection ?? "")).toBeLessThan(Date.UTC(2026, 11, 1));
    const late = goalView(record, facts, new Date(Date.UTC(2026, 11, 2)));
    expect(late).toMatchObject({ status: "missed", pace: null });
  });
});

describe("goal suggestions", () => {
  it("proposes a little more than today, skipping the kinds already pursued", () => {
    const facts = [fact(2), fact(3), fact(4), fact(5)];
    const kinds = goalSuggestions(facts, new Set(["hours"]), new Date(day(10))).map(
      (s) => s.definition.kind,
    );
    expect(kinds).toEqual(["softLandings", "regularity", "airports"]);
  });
});
