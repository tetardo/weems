import { DevMetrics } from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

const readMetrics = async () => {
  const response = await app.inject({ method: "GET", url: "/v1/dev/metrics" });
  expect(response.statusCode).toBe(200);
  return DevMetrics.parse(response.json());
};

describe("API metrics for the load test (development only)", () => {
  it("gives event loop delay, memory and the flights on the live map", async () => {
    const before = await readMetrics();
    const flight = syntheticFlight();
    await app.inject({
      method: "POST",
      url: "/v1/flights",
      headers: TRACKER_HEADERS,
      payload: flight.open,
    });
    await app.inject({
      method: "POST",
      url: `/v1/flights/${flight.open.flightId}/positions`,
      headers: TRACKER_HEADERS,
      payload: flight.position,
    });

    const after = await readMetrics();
    expect(after.live.flights).toBe(before.live.flights + 1);
    expect(after.live.viewers).toBe(0);
    expect(after.memoryMb.rss).toBeGreaterThan(0);
    expect(after.eventLoopDelayMs.max).toBeGreaterThanOrEqual(after.eventLoopDelayMs.p50);
  });

  it("does not exist in production", async () => {
    const production = await startTestApp({
      WEEMS_ENV: "production",
      WEEMS_AUTH_SECRET: "x".repeat(32),
    });
    try {
      const response = await production.app.inject({ method: "GET", url: "/v1/dev/metrics" });
      expect(response.statusCode).toBe(404);
    } finally {
      await production.stop();
    }
  });
});
