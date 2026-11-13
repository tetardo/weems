import type { GoalView } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { goalChartShape, roundStep } from "./goal-chart-geometry.ts";

const DAY = 86_400_000;
const goal = (patch: Partial<GoalView>): GoalView =>
  ({
    from: "2026-11-01T00:00:00.000Z",
    to: "2026-12-01T00:00:00.000Z",
    value: 6,
    total: 20,
    series: [],
    projection: null,
    ...patch,
  }) as GoalView;

describe("roundStep", () => {
  it("picks 1, 2, 2.5 or 5 times a power of ten, never under 1", () => {
    expect(roundStep(20)).toBe(5);
    expect(roundStep(85)).toBe(25);
    expect(roundStep(10)).toBe(2.5);
    expect(roundStep(3)).toBe(1);
  });
});

describe("goalChartShape", () => {
  it("ends the scale on a round value and lists its ticks", () => {
    const shape = goalChartShape(goal({}), Date.parse("2026-11-13T12:00:00Z"));
    expect(shape.top).toBe(20);
    expect(shape.ticks).toEqual([0, 5, 10, 15, 20]);
  });

  it("shows at least a week for a goal without end, so a new goal is not a single day", () => {
    const from = "2026-11-13T10:00:00.000Z";
    const shape = goalChartShape(goal({ from, to: null }), Date.parse(from) + 60_000);
    expect(shape.to - shape.from).toBe(7 * DAY);
  });
});
