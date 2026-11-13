import { PilotHandle } from "@weems/contrats";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { seededRandom } from "../generate-flights/random.ts";
import { identities } from "./identities.ts";
import { flyPastFlight, type PastFlight } from "./past-flight.ts";
import { SIMULATED_TYPES } from "../generate-flights/aircraft-types.ts";
import { airportOf } from "../generate-flights/airports/airport-data.ts";
import { destinationsOf, estimatedAirborneS, scenarioOf } from "../generate-flights/routes.ts";
import { FICTITIOUS_SIMULATOR, liveScenario, scheduleOf } from "./schedule.ts";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-11-11T12:00:00.000Z");
const typeOf = (flight: PastFlight) => {
  const type = SIMULATED_TYPES.find((t) => t.aircraft.model === flight.scenario.aircraft.model);
  if (!type) throw new Error("unknown type");
  return type;
};
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
      const landed = (f: PastFlight) =>
        f.openedAtMs +
        estimatedAirborneS(typeOf(f), f.scenario.departure, f.scenario.arrival) * 1000;
      expect(
        flights.every((f, i) => i === 0 || f.openedAtMs > landed(flights[i - 1] as PastFlight)),
      ).toBe(true);
      expect(flights.every((f) => f.openedAtMs >= window.fromMs && landed(f) < NOW)).toBe(true);
      expect(createdAtMs).toBeLessThan(flights[0]?.openedAtMs ?? NOW);
    }
  });

  it("spoils a few flights (crash, teleport, slew, interrupted), never most of them", () => {
    const flights = schedules.flatMap((s) => s.flights);
    const spoilt = flights.filter(
      (f) =>
        f.interruptAtShare !== undefined ||
        f.scenario.disturbances.some((d) => ["crash", "teleport", "slew"].includes(d)),
    );
    expect(spoilt.length / flights.length).toBeGreaterThan(0.02);
    expect(spoilt.length / flights.length).toBeLessThan(0.1);
  });

  it("flies varied types and routes, declared MSFS 2024 so that they count for the ranks", () => {
    const flights = schedules.flatMap((s) => s.flights);
    expect(new Set(flights.map((f) => f.scenario.aircraft.model)).size).toBeGreaterThan(15);
    expect(new Set(flights.map((f) => f.scenario.name)).size).toBeGreaterThan(300);
    expect(flights.every((f) => f.scenario.aircraft.simulator === FICTITIOUS_SIMULATOR)).toBe(true);
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

  it("closes the flight of every simulated type, even after a go-around", async () => {
    const from = airportOf("LFPG");
    for (const type of SIMULATED_TYPES) {
      const sent: string[] = [];
      const api = { post: async (path: string) => (sent.push(path), { status: 201 }) };
      const [to] = destinationsOf(type, from).sort(
        (a, b) => estimatedAirborneS(type, from, a) - estimatedAirborneS(type, from, b),
      );
      if (!to) throw new Error(`${type.aircraft.model}: no destination`);
      const order = {
        callsign: "WMS1",
        seed: 1,
        type,
        from,
        to,
        disturbances: ["goAround"],
      } as const;
      await flyPastFlight(
        { scenario: scenarioOf(order), openedAtMs: NOW - DAY_MS },
        { api, workDir: join(tmpdir(), "weems-populate-test"), trackerVersion: "0.1.0" },
      );
      expect(
        sent.some((path) => path.endsWith("/close")),
        type.aircraft.model ?? "",
      ).toBe(true);
    }
  }, 60_000);
});
