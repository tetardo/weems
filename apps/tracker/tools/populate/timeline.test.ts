import { describe, expect, it } from "vitest";
import { seededRandom } from "../generate-flights/random.ts";
import { careerDepartures, hobbyDepartures } from "./timeline.ts";

const DAY_MS = 24 * 3600_000;
const NOW = Date.parse("2026-11-13T12:00:00.000Z");
const window = { fromMs: NOW - 180 * DAY_MS, nowMs: NOW };

/** Every flight lands (plus ground time) before the next departure. */
function inOrder(times: readonly number[], airborneMs: readonly number[]) {
  return times.every((t, i) => i === 0 || t >= (times[i - 1] ?? 0) + (airborneMs[i - 1] ?? 0));
}

describe("timeline of a pilot's history", () => {
  it("keeps every flight of a career, one after the other, landed before now", () => {
    const airborneMs = Array.from({ length: 720 }, (_, i) => (1 + (i % 9)) * 3600_000);
    const times = careerDepartures(airborneMs, window, seededRandom(1));
    expect(times).toHaveLength(720);
    expect(inOrder(times, airborneMs)).toBe(true);
    expect((times.at(-1) ?? 0) + (airborneMs.at(-1) ?? 0)).toBeLessThan(NOW);
    // 720 flights need years, not the 6 months of the hobby pilots.
    expect(NOW - (times[0] ?? NOW)).toBeGreaterThan(2 * 365 * DAY_MS);
  });

  it("spaces a hobby pilot's flights by their length, in the window", () => {
    const airborneMs = Array.from({ length: 40 }, (_, i) => (i % 2 ? 8 : 1) * 3600_000);
    const times = hobbyDepartures(airborneMs, window, seededRandom(2));
    expect(times.length).toBeGreaterThan(30);
    expect(inOrder(times, airborneMs)).toBe(true);
    expect(times.every((t) => t >= window.fromMs && t < NOW)).toBe(true);
  });
});
