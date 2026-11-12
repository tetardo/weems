import type { FastifyInstance } from "fastify";
import { uuidV7, type LiveRoute } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => ({ app, stop } = await startTestApp()));
afterAll(() => stop());

const post = (url: string, payload: object) =>
  app.inject({ method: "POST", url, payload, headers: TRACKER_HEADERS });
const route = (flightId: string) =>
  app.inject({ method: "GET", url: `/v1/live/flights/${flightId}/route` });

describe("GET /v1/live/flights/{flightId}/route", () => {
  it("gives the airports and the trail of a flight on the map, to any spectator", async () => {
    const flight = syntheticFlight();
    const id = flight.open.flightId;
    await post("/v1/flights", flight.open);
    await post(`/v1/flights/${id}/positions`, flight.position);

    const response = await route(id);
    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("*");
    expect(response.json<LiveRoute>()).toEqual({
      departure: expect.objectContaining({ icao: "LFPG", lat: 49.009, lon: 2.5541 }),
      arrival: expect.objectContaining({ icao: "LFBO", lat: 43.6291, lon: 1.3638 }),
      trail: [[1.9, 46.2]],
    });
  });

  it("answers null for an airport the pilot did not give", async () => {
    const flight = syntheticFlight();
    const id = flight.open.flightId;
    await post("/v1/flights", { ...flight.open, plannedArrivalIcao: null });
    await post(`/v1/flights/${id}/positions`, flight.position);
    expect((await route(id)).json<LiveRoute>().arrival).toBeNull();
  });

  it("answers 404 for a flight that is not on the map, and 400 for a bad id", async () => {
    const flight = syntheticFlight();
    await post("/v1/flights", flight.open);
    const missing = await route(flight.open.flightId);
    expect(missing.statusCode).toBe(404);
    expect(missing.headers["access-control-allow-origin"]).toBe("*");
    expect((await route(uuidV7())).statusCode).toBe(404);
    expect((await route("not-an-id")).statusCode).toBe(400);
  });
});
