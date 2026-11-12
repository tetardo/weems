import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newTrackerPilot } from "../../testing/pilots.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

/** A new pilot with one flight opened, with events and a review. */
async function pilotWithFlight(): Promise<{ cookie: string; flightId: string }> {
  const { cookie, tracker: headers } = await newTrackerPilot(app);
  const flight = syntheticFlight();
  const { flightId } = flight.open;
  await app.inject({ method: "POST", url: "/v1/flights", headers, payload: flight.open });
  await app.inject({
    method: "POST",
    url: `/v1/flights/${flightId}/events`,
    headers,
    payload: { events: flight.events },
  });
  await app.inject({
    method: "PUT",
    url: `/v1/flights/${flightId}/review`,
    headers: { cookie },
    payload: { phases: "correct" },
  });
  return { cookie, flightId };
}

const listOf = async (cookie: string) =>
  (await app.inject({ method: "GET", url: "/v1/flights", headers: { cookie } })).json().flights;

describe("delete all my flights (development only)", () => {
  it("empties the caller's list and leaves other pilots' flights", async () => {
    const me = await pilotWithFlight();
    const other = await pilotWithFlight();
    expect(await listOf(me.cookie)).toHaveLength(1);

    const deleted = await app.inject({
      method: "DELETE",
      url: "/v1/flights",
      headers: { cookie: me.cookie },
    });
    expect(deleted.statusCode).toBe(204);
    expect(await listOf(me.cookie)).toHaveLength(0);
    expect(await listOf(other.cookie)).toHaveLength(1);
  });

  it("with ?simulator=replay, deletes the simulated flights and keeps the real ones", async () => {
    const { cookie, tracker: headers } = await newTrackerPilot(app);
    const simulated = syntheticFlight();
    const real = syntheticFlight();
    real.open.aircraft.simulator = "msfs2024";
    for (const flight of [simulated, real]) {
      await app.inject({ method: "POST", url: "/v1/flights", headers, payload: flight.open });
    }
    const counts = () =>
      app.inject({ method: "GET", url: "/v1/dev/flight-counts", headers: { cookie } });
    expect((await counts()).json()).toEqual({ simulated: 1, real: 1 });

    const deleted = await app.inject({
      method: "DELETE",
      url: "/v1/flights?simulator=replay",
      headers: { cookie },
    });
    expect(deleted.statusCode).toBe(204);
    expect((await counts()).json()).toEqual({ simulated: 0, real: 1 });
    expect((await listOf(cookie)).map((f: { flightId: string }) => f.flightId)).toEqual([
      real.open.flightId,
    ]);
  });

  it("needs a logged-in pilot", async () => {
    expect((await app.inject({ method: "DELETE", url: "/v1/flights" })).statusCode).toBe(401);
  });

  it("does not exist in production", async () => {
    const production = await startTestApp({
      WEEMS_ENV: "production",
      WEEMS_AUTH_SECRET: "x".repeat(32),
    });
    try {
      const response = await production.app.inject({ method: "DELETE", url: "/v1/flights" });
      expect(response.statusCode).toBe(404);
    } finally {
      await production.stop();
    }
  });
});
