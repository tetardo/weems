import type { FastifyInstance } from "fastify";
import type { SiteStats } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { newPilot } from "../../testing/pilots.ts";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => ({ app, stop } = await startTestApp()));
afterAll(() => stop());

const stats = async () => {
  const response = await app.inject({ method: "GET", url: "/v1/stats" });
  expect(response.statusCode).toBe(200);
  expect(response.headers["cache-control"]).toBe("public, max-age=30");
  return response.json<SiteStats>();
};
const post = (url: string, payload: object) =>
  app.inject({ method: "POST", url, payload, headers: TRACKER_HEADERS });

describe("GET /v1/stats", () => {
  it("counts pilots, flights and flights live, without account", async () => {
    const before = await stats();
    await newPilot(app);
    const flight = syntheticFlight();
    await post("/v1/flights", flight.open);
    await post(`/v1/flights/${flight.open.flightId}/positions`, flight.position);

    const after = await stats();
    // Other test files share the database: at least one more of each.
    expect(after.pilots).toBeGreaterThanOrEqual(before.pilots + 1);
    expect(after.flights).toBeGreaterThanOrEqual(before.flights + 1);
    expect(after.liveFlights).toBe(before.liveFlights + 1);
  });
});
