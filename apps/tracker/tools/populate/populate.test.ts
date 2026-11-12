import { PilotHandle } from "@weems/contrats";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { seededRandom } from "../generate-flights/random.ts";
import { identities } from "./identities.ts";
import { flyPastFlight } from "./past-flight.ts";
import { liveScenario, scheduleOf } from "./schedule.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-11-11T12:00:00.000Z");
const window = { minFlights: 5, maxFlights: 40, fromMs: NOW - 180 * DAY_MS, nowMs: NOW };

describe("fictitious identities", () => {
  it("are valid profile addresses, unique, and public in the share asked", () => {
    const people = identities(400, 0.75, seededRandom(1));
    for (const person of people) expect(PilotHandle.safeParse(person.handle).success).toBe(true);
    expect(new Set(people.map((p) => p.handle)).size).toBe(400);
    const share = people.filter((p) => p.isPublic).length / people.length;
    expect(share).toBeGreaterThan(0.65);
    expect(share).toBeLessThan(0.85);
  });
});

describe("schedule of a fictitious pilot", () => {
  const random = seededRandom(2);
  const schedules = identities(60, 1, random).map((person) => scheduleOf(person, window, random));

  it("draws a different number of flights per pilot, within the range", () => {
    const counts = schedules.map((s) => s.flights.length);
    expect(Math.max(...counts)).toBeLessThanOrEqual(40);
    expect(new Set(counts).size).toBeGreaterThan(10);
  });

  it("flies in the past, one flight after the other, after the account was created", () => {
    for (const { flights, createdAtMs } of schedules) {
      const times = flights.map((f) => f.openedAtMs);
      expect(times.every((t, i) => i === 0 || t - (times[i - 1] ?? 0) >= 4 * 60 * 60 * 1000)).toBe(
        true,
      );
      expect(times.every((t) => t >= window.fromMs && t < NOW)).toBe(true);
      expect(createdAtMs).toBeLessThan(times[0] ?? NOW);
    }
  });

  it("chains the legs from the home airport", () => {
    for (const { identity, flights } of schedules) {
      expect(flights[0]?.scenario.departure.icao).toBe(identity.homeIcao);
      flights.slice(1).forEach((flight, i) => {
        expect(flight.scenario.departure.icao).toBe(flights[i]?.scenario.arrival.icao);
      });
    }
  });

  it("takes off mostly outside working hours (local time)", () => {
    const hours = schedules.flatMap((s) =>
      s.flights.map((f) => new Date(f.openedAtMs + 3600_000).getUTCHours()),
    );
    const office = hours.filter((h) => h >= 11 && h < 16).length / hours.length;
    expect(office).toBeLessThan(0.4);
  });

  it("draws live flights between two different airports", () => {
    const scenario = liveScenario("WMS800", seededRandom(3));
    expect(scenario.departure.icao).not.toBe(scenario.arrival.icao);
  });
});

describe("past flight", () => {
  it("goes through the real tracker with the times of its day in the past", async () => {
    const sent: { path: string; body: { openedAt?: string; closedAt?: string } }[] = [];
    const api = {
      post: async (path: string, body: unknown) => {
        sent.push({ path, body: body as { openedAt?: string } });
        return { status: 201 };
      },
    };
    const random = seededRandom(4);
    const [person] = identities(1, 1, random);
    const flight =
      person && scheduleOf(person, { ...window, minFlights: 1, maxFlights: 1 }, random).flights[0];
    if (!flight) throw new Error("no flight drawn");
    const left = await flyPastFlight(flight, {
      api,
      workDir: join(tmpdir(), "weems-populate-test"),
      trackerVersion: "0.1.0",
    });
    expect(left).toBe(0);
    const opened = sent.find((s) => s.path === "/v1/flights");
    expect(opened?.body.openedAt).toBe(new Date(flight.openedAtMs).toISOString());
    const closed = sent.find((s) => s.path.endsWith("/close"));
    expect(Date.parse(closed?.body.closedAt ?? "")).toBeGreaterThan(flight.openedAtMs);
    expect(Date.parse(closed?.body.closedAt ?? "")).toBeLessThan(flight.openedAtMs + 6 * 3600_000);
    expect(sent.some((s) => s.path.endsWith("/track"))).toBe(true);
  });
});
