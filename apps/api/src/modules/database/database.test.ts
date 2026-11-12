import type { AdminDatabase } from "@weems/contrats";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseService } from "../../app.ts";
import { invitations } from "../../db/auth-schema.ts";
import { flights } from "../../db/schema.ts";
import { countMigrationFiles } from "../../db/migration-journal.ts";
import { connectTestDatabase } from "../../testing/database.ts";
import { invite, newPilot, newTrackerPilot, uniqueEmail } from "../../testing/pilots.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;
let admin: string;
const database = connectTestDatabase();

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
  admin = await newPilot(app, uniqueEmail(), "admin");
});
afterAll(async () => {
  await stop();
  await database.close();
});

const URL = "/v1/admin/database";
const CLEANUP = "/v1/admin/database/cleanup";

/** Opens a flight of this simulator at this date for the pilot. Returns its id. */
async function open(
  headers: Record<string, string>,
  simulator: "msfs2024" | "replay",
  openedAt: string,
): Promise<string> {
  const flight = syntheticFlight();
  const aircraft = { ...flight.open.aircraft, simulator };
  const response = await app.inject({
    method: "POST",
    url: "/v1/flights",
    headers,
    payload: { ...flight.open, aircraft, openedAt },
  });
  expect(response.statusCode).toBe(201);
  return flight.open.flightId;
}

const exists = async (flightId: string) =>
  (await database.db.select().from(flights).where(eq(flights.id, flightId))).length === 1;

describe("GET /v1/admin/database", () => {
  it("answers 401 without a session and 403 to a pilot", async () => {
    expect((await app.inject({ method: "GET", url: URL })).statusCode).toBe(401);
    const pilot = await newPilot(app);
    const refused = await app.inject({ method: "GET", url: URL, headers: { cookie: pilot } });
    expect(refused.statusCode).toBe(403);
    const post = await app.inject({
      method: "POST",
      url: CLEANUP,
      headers: { cookie: pilot },
      payload: { simulatedFlights: false, expiredSessions: true, expiredInvitations: false },
    });
    expect(post.statusCode).toBe(403);
  });

  it("gives the server, the tables largest first and every migration applied", async () => {
    const response = await app.inject({ method: "GET", url: URL, headers: { cookie: admin } });
    expect(response.statusCode).toBe(200);
    const body: AdminDatabase = response.json();

    expect(body.server.version).toMatch(/^PostgreSQL \d+/);
    expect(body.server.name).toBe("weems_test");
    expect(body.totalBytes).toBeGreaterThan(0);
    const sizes = body.tables.map((table) => table.totalBytes);
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    const tracks = body.tables.find((table) => table.name === "flight_tracks");
    expect(tracks?.simulatedShare).not.toBeNull();
    expect(body.tables.find((table) => table.name === "users")?.simulatedShare).toBeNull();
    expect(body.migrations).toHaveLength(countMigrationFiles());
    expect(body.migrations.every((m) => m.state === "applied")).toBe(true);
    expect(body.cleanup.olderThanDays).toBe(7);
  });
});

describe("POST /v1/admin/database/cleanup", () => {
  it("refuses a request that cleans nothing", async () => {
    const response = await app.inject({
      method: "POST",
      url: CLEANUP,
      headers: { cookie: admin },
      payload: { simulatedFlights: false, expiredSessions: false, expiredInvitations: false },
    });
    expect(response.statusCode).toBe(400);
  });

  it("deletes the expired sessions only when asked", async () => {
    const response = await app.inject({
      method: "POST",
      url: CLEANUP,
      headers: { cookie: admin },
      payload: { simulatedFlights: false, expiredSessions: true, expiredInvitations: false },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ simulatedFlights: 0, expiredInvitations: 0 });
  });
});

/**
 * The deletions themselves run on a clock set in 2020: the test database is shared with the
 * other test files, whose flights (dated 2026) and invitations stay out of reach.
 */
describe("cleanup of old simulated flights and expired invitations", () => {
  const now = new Date("2020-01-20T12:00:00.000Z");
  const live = { closed: () => undefined };
  const service = () => createDatabaseService(database.db, live, () => now);

  it("deletes simulated flights older than 7 days, never a real one nor a recent one", async () => {
    const pilot = await newTrackerPilot(app);
    const oldSimulated = await open(pilot.tracker, "replay", "2020-01-02T08:00:00.000Z");
    const oldReal = await open(pilot.tracker, "msfs2024", "2020-01-02T08:00:00.000Z");
    const recentSimulated = await open(pilot.tracker, "replay", "2020-01-19T08:00:00.000Z");

    const before = await service().database();
    expect(before.cleanup.simulatedFlights.count).toBeGreaterThanOrEqual(1);

    const result = await service().cleanup({
      simulatedFlights: true,
      expiredSessions: false,
      expiredInvitations: false,
    });
    expect(result.simulatedFlights).toBeGreaterThanOrEqual(1);
    expect(await exists(oldSimulated)).toBe(false);
    expect(await exists(oldReal)).toBe(true);
    expect(await exists(recentSimulated)).toBe(true);
  });

  it("deletes the invitations whose 14 days have passed, not the open ones", async () => {
    const expired = await invite(uniqueEmail());
    const open = await invite(uniqueEmail());
    await database.db
      .update(invitations)
      .set({ expiresAt: new Date("2020-01-10T00:00:00.000Z") })
      .where(eq(invitations.code, expired));

    expect((await service().database()).cleanup.expiredInvitations).toBeGreaterThanOrEqual(1);
    const result = await service().cleanup({
      simulatedFlights: false,
      expiredSessions: false,
      expiredInvitations: true,
    });
    expect(result.expiredInvitations).toBeGreaterThanOrEqual(1);
    const left = await database.db.select().from(invitations);
    expect(left.some((row) => row.code === expired)).toBe(false);
    expect(left.some((row) => row.code === open)).toBe(true);
  });
});
