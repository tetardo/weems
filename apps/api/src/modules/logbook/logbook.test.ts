import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot } from "../../testing/pilots.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => ({ app, stop } = await startTestApp()));
afterAll(() => stop());

describe("GET /v1/me/logbook/summary", () => {
  it("needs a pilot", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/me/logbook/summary" });
    expect(response.statusCode).toBe(401);
  });

  it("answers an empty summary to a pilot without flights", async () => {
    const cookie = await newPilot(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/me/logbook/summary",
      headers: { cookie },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ lastFlight: null, recentFlights: [], flyingDays: [] });
  });
});
