import type { AdminSupervision } from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { countMigrationFiles } from "../../db/client.ts";
import { newPilot, newTrackerPilot, uniqueEmail } from "../../testing/pilots.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;
let admin: string;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
  admin = await newPilot(app, uniqueEmail(), "admin");
});
afterAll(() => stop());

const URL = "/v1/admin/supervision";

async function supervision(): Promise<AdminSupervision> {
  const response = await app.inject({ method: "GET", url: URL, headers: { cookie: admin } });
  expect(response.statusCode).toBe(200);
  return response.json();
}

/** Opens a flight with this simulator for the pilot, with one position. */
async function open(headers: Record<string, string>, simulator: "msfs2024" | "replay") {
  const flight = syntheticFlight();
  const send = (url: string, payload: object) =>
    app.inject({ method: "POST", url, headers, payload });
  await send("/v1/flights", { ...flight.open, aircraft: { ...flight.open.aircraft, simulator } });
  const position = await send(`/v1/flights/${flight.open.flightId}/positions`, flight.position);
  expect(position.statusCode).toBe(201);
}

describe("GET /v1/admin/supervision", () => {
  it("answers 401 without a session and 403 to a pilot", async () => {
    expect((await app.inject({ method: "GET", url: URL })).statusCode).toBe(401);
    const pilot = await newPilot(app);
    const refused = await app.inject({ method: "GET", url: URL, headers: { cookie: pilot } });
    expect(refused.statusCode).toBe(403);
  });

  it("counts real flights apart from the simulated ones (replay)", async () => {
    const pilot = await newTrackerPilot(app);
    const before = await supervision();
    await open(pilot.tracker, "msfs2024");
    await open(pilot.tracker, "replay");
    const after = await supervision();

    // Other test files share the database: at least one more of each.
    expect(after.tiles.flights.real).toBeGreaterThanOrEqual(before.tiles.flights.real + 1);
    expect(after.tiles.flights.simulated).toBeGreaterThanOrEqual(
      before.tiles.flights.simulated + 1,
    );
    expect(after.tiles.accounts.real).toBeGreaterThanOrEqual(before.tiles.accounts.real);
    expect(after.health.trackerVersions.map((v) => v.version)).toContain("0.1.0");
  });

  it("measures the positions received and the response times", async () => {
    const pilot = await newTrackerPilot(app);
    await open(pilot.tracker, "replay");
    const { health } = await supervision();

    expect(health.positionsPerMinute).toHaveLength(30);
    expect(health.positionsPerMinute.at(-1)).toBeGreaterThanOrEqual(1);
    expect(health.lastPositionAt).not.toBeNull();
    expect(health.apiHours).toHaveLength(24);
    expect(health.apiHours.at(-1)?.p95Ms).toBeGreaterThan(0);
  });

  it("reads the database: size, largest tables, migrations all applied", async () => {
    const { health } = await supervision();

    expect(health.database.bytes).toBeGreaterThan(0);
    expect(health.database.largestTables).toHaveLength(3);
    expect(health.migrations).toEqual({
      applied: countMigrationFiles(),
      expected: countMigrationFiles(),
    });
  });

  it("gives 7 days of tiles, 14 days of activity, at most 10 events newest first", async () => {
    const { tiles, activity, community } = await supervision();

    expect(tiles.accounts.daily).toHaveLength(7);
    expect(tiles.accounts.daily.at(-1)).toBeLessThanOrEqual(tiles.accounts.real);
    expect(tiles.flights.daily).toHaveLength(7);
    expect(tiles.profiles.daily).toHaveLength(7);
    expect(activity.days).toHaveLength(14);
    expect(activity.events.length).toBeLessThanOrEqual(10);
    const times = activity.events.map((event) => Date.parse(event.at));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(community.newest.length).toBeLessThanOrEqual(8);
  });
});
